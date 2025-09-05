// CodeMirror editor initialization
let editor;

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('sqlEditor');
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'text/x-sql',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        extraKeys: {
            "Ctrl-Enter": executeQuery,
            "Cmd-Enter": executeQuery
        }
    });
    
    editor.setValue("SELECT * FROM users;\n\n-- ここにSQLクエリを入力してください\n-- 例: SELECT name, email FROM users WHERE age > 25;");
    editor.focus();
});

// インメモリデータベース
let database = {
    users: [
        { id: 1, name: '田中太郎', email: 'tanaka@example.com', age: 28, department: '営業部' },
        { id: 2, name: '佐藤花子', email: 'sato@example.com', age: 32, department: '開発部' },
        { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', age: 26, department: '営業部' },
        { id: 4, name: '高橋美咲', email: 'takahashi@example.com', age: 35, department: '人事部' },
        { id: 5, name: '山田健太', email: 'yamada@example.com', age: 29, department: '開発部' }
    ],
    orders: [
        { id: 1, user_id: 1, product_name: 'ノートPC', price: 80000, order_date: '2024-01-15' },
        { id: 2, user_id: 2, product_name: 'マウス', price: 3000, order_date: '2024-01-20' },
        { id: 3, user_id: 1, product_name: 'キーボード', price: 8000, order_date: '2024-02-01' },
        { id: 4, user_id: 3, product_name: 'モニター', price: 25000, order_date: '2024-02-10' },
        { id: 5, user_id: 4, product_name: 'プリンター', price: 15000, order_date: '2024-02-15' }
    ],
    departments: [
        { id: 1, name: '営業部', manager: '営業部長' },
        { id: 2, name: '開発部', manager: '技術部長' },
        { id: 3, name: '人事部', manager: '人事部長' }
    ]
};

// 初期データのバックアップ
const initialData = JSON.parse(JSON.stringify(database));

function resetDatabase() {
    database = JSON.parse(JSON.stringify(initialData));
    showResult('データベースをリセットしました。', 'success');
}

function executeQuery() {
    const query = editor.getValue().trim();
    if (!query) {
        showResult('SQLクエリを入力してください。', 'error');
        return;
    }

    try {
        const result = processSQL(query);
        displayResult(result);
    } catch (error) {
        showResult(`エラー: ${error.message}`, 'error');
    }
}

function processSQL(query) {
    const sql = query.toLowerCase().trim();
    
    if (sql.startsWith('select')) {
        return processSelect(query);
    } else if (sql.startsWith('insert')) {
        return processInsert(query);
    } else if (sql.startsWith('update')) {
        return processUpdate(query);
    } else if (sql.startsWith('delete')) {
        return processDelete(query);
    } else {
        throw new Error('サポートされていないSQL文です。SELECT, INSERT, UPDATE, DELETEのみサポートしています。');
    }
}

function processSelect(query) {
    const sql = query.toLowerCase();
    
    // 基本的なSELECT文の解析
    if (sql.includes('*') && sql.includes('from users') && !sql.includes('join')) {
        let result = [...database.users];
        if (sql.includes('where')) {
            result = filterData(result, query);
        }
        return result;
    }
    
    if (sql.includes('*') && sql.includes('from orders')) {
        let result = [...database.orders];
        if (sql.includes('where')) {
            result = filterData(result, query);
        }
        return result;
    }

    if (sql.includes('*') && sql.includes('from departments')) {
        return [...database.departments];
    }

    // JOIN操作
    if (sql.includes('join')) {
        return processJoin(query);
    }

    // 集約関数
    if (sql.includes('count') || sql.includes('group by')) {
        return processAggregate(query);
    }

    // 特定カラム選択
    if (sql.includes('from users')) {
        return processColumnSelect(query, 'users');
    }

    throw new Error('クエリを解析できませんでした。より簡単なクエリを試してください。');
}

function filterData(data, query) {
    const sql = query.toLowerCase();
    
    if (sql.includes('age >')) {
        const ageMatch = query.match(/age\s*>\s*(\d+)/i);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            return data.filter(item => item.age > age);
        }
    }

    if (sql.includes('age <')) {
        const ageMatch = query.match(/age\s*<\s*(\d+)/i);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            return data.filter(item => item.age < age);
        }
    }

    if (sql.includes('department =')) {
        const deptMatch = query.match(/department\s*=\s*['"]([^'"]+)['"]/i);
        if (deptMatch) {
            const dept = deptMatch[1];
            return data.filter(item => item.department === dept);
        }
    }

    return data;
}

function processJoin(query) {
    const sql = query.toLowerCase();
    
    if (sql.includes('users') && sql.includes('orders')) {
        const result = [];
        for (const user of database.users) {
            for (const order of database.orders) {
                if (order.user_id === user.id) {
                    result.push({
                        user_name: user.name,
                        user_email: user.email,
                        product_name: order.product_name,
                        price: order.price,
                        order_date: order.order_date
                    });
                }
            }
        }
        return result;
    }

    throw new Error('JOINクエリの解析に失敗しました。');
}

function processAggregate(query) {
    const sql = query.toLowerCase();
    
    if (sql.includes('count') && sql.includes('group by department')) {
        const result = {};
        for (const user of database.users) {
            result[user.department] = (result[user.department] || 0) + 1;
        }
        
        return Object.entries(result).map(([department, count]) => ({
            department,
            count
        }));
    }

    throw new Error('集約クエリの解析に失敗しました。');
}

function processColumnSelect(query, table) {
    const sql = query.toLowerCase();
    const data = database[table];
    
    // name, email の選択
    if (sql.includes('name') && sql.includes('email')) {
        return data.map(item => ({ name: item.name, email: item.email }));
    }

    return data;
}

function processInsert(query) {
    const sql = query.toLowerCase();
    
    if (sql.includes('insert into users')) {
        const valuesMatch = query.match(/values\s*\(([^)]+)\)/i);
        if (valuesMatch) {
            const values = valuesMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
            const newId = Math.max(...database.users.map(u => u.id)) + 1;
            
            const newUser = {
                id: newId,
                name: values[0],
                email: values[1],
                age: parseInt(values[2]) || 0,
                department: values[3] || ''
            };
            
            database.users.push(newUser);
            return `ユーザーが追加されました: ${newUser.name}`;
        }
    }

    throw new Error('INSERT文の解析に失敗しました。');
}

function processUpdate(query) {
    const sql = query.toLowerCase();
    
    if (sql.includes('update users')) {
        const setMatch = query.match(/set\s+(\w+)\s*=\s*['"]([^'"]+)['"]/i);
        const whereMatch = query.match(/where\s+id\s*=\s*(\d+)/i);
        
        if (setMatch && whereMatch) {
            const field = setMatch[1];
            const value = setMatch[2];
            const id = parseInt(whereMatch[1]);
            
            const user = database.users.find(u => u.id === id);
            if (user) {
                user[field] = value;
                return `ユーザーID ${id} の ${field} を更新しました。`;
            }
        }
    }

    throw new Error('UPDATE文の解析に失敗しました。');
}

function processDelete(query) {
    const sql = query.toLowerCase();
    
    if (sql.includes('delete from users')) {
        const whereMatch = query.match(/where\s+id\s*=\s*(\d+)/i);
        
        if (whereMatch) {
            const id = parseInt(whereMatch[1]);
            const index = database.users.findIndex(u => u.id === id);
            
            if (index !== -1) {
                const deletedUser = database.users.splice(index, 1)[0];
                return `ユーザー ${deletedUser.name} を削除しました。`;
            }
        }
    }

    throw new Error('DELETE文の解析に失敗しました。');
}

function displayResult(result) {
    const resultArea = document.getElementById('resultArea');
    const queryResult = document.getElementById('queryResult');
    
    // Show result area
    resultArea.style.display = 'block';
    
    if (typeof result === 'string') {
        queryResult.innerHTML = `<div class="success">${result}</div>`;
        return;
    }

    if (Array.isArray(result) && result.length === 0) {
        queryResult.innerHTML = `<div class="success">クエリの実行は成功しましたが、結果が0件でした。</div>`;
        return;
    }

    if (Array.isArray(result)) {
        const table = createTable(result);
        queryResult.innerHTML = `
            <div class="success" style="margin: 15px; margin-bottom: 0;">
                クエリが正常に実行されました。結果: ${result.length}件
            </div>
            ${table}
        `;
    } else {
        queryResult.innerHTML = `<div class="success">${result}</div>`;
    }
}

function createTable(data) {
    if (!data || data.length === 0) return '';

    const columns = Object.keys(data[0]);
    
    let html = '<table>';
    html += '<thead><tr>';
    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
            html += `<td>${row[col] || ''}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

function showResult(message, type) {
    const resultArea = document.getElementById('resultArea');
    const queryResult = document.getElementById('queryResult');
    
    // Show result area
    resultArea.style.display = 'block';
    queryResult.innerHTML = `<div class="${type}" style="margin: 15px;">${message}</div>`;
}

function clearEditor() {
    if (editor) {
        editor.setValue('');
    }
    document.getElementById('resultArea').style.display = 'none';
    document.getElementById('queryResult').innerHTML = '';
}