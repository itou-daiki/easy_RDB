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
            "Cmd-Enter": executeQuery,
            "Ctrl-Up": () => navigateHistory('up'),
            "Ctrl-Down": () => navigateHistory('down'),
            "Ctrl-Space": showAutoComplete
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

    // クエリを履歴に追加
    addToHistory(query);

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
    // \n を実際の改行に変換し、エスケープされたクォートを処理
    const cleanQuery = query.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const sql = cleanQuery.toLowerCase().replace(/\s+/g, ' ');

    if (sql.includes('insert into users')) {
        const valuesMatch = cleanQuery.match(/VALUES\s*\(([^)]+)\)/i);
        if (valuesMatch) {
            // エスケープ文字とクォートを適切に処理
            const values = valuesMatch[1].split(',').map(v =>
                v.trim().replace(/\\?['"]/g, '').replace(/\\\\/g, '\\')
            );
            const newId = Math.max(...database.users.map(u => u.id)) + 1;

            const newUser = {
                id: newId,
                name: values[0] || '',
                email: values[1] || '',
                age: parseInt(values[2]) || 0,
                department: values[3] || ''
            };

            database.users.push(newUser);
            return `ユーザーが追加されました: ${newUser.name}`;
        }
    }

    if (sql.includes('insert into orders')) {
        const valuesMatch = cleanQuery.match(/VALUES\s*\(([^)]+)\)/i);
        if (valuesMatch) {
            const values = valuesMatch[1].split(',').map(v =>
                v.trim().replace(/\\?['"]/g, '').replace(/\\\\/g, '\\')
            );
            const newId = Math.max(...database.orders.map(o => o.id)) + 1;

            const newOrder = {
                id: newId,
                user_id: parseInt(values[0]) || 1,
                product_name: values[1] || '',
                price: parseInt(values[2]) || 0,
                order_date: values[3] || new Date().toISOString().split('T')[0]
            };

            database.orders.push(newOrder);
            return `注文が追加されました: ${newOrder.product_name}`;
        }
    }

    if (sql.includes('insert into departments')) {
        const valuesMatch = cleanQuery.match(/VALUES\s*\(([^)]+)\)/i);
        if (valuesMatch) {
            const values = valuesMatch[1].split(',').map(v =>
                v.trim().replace(/\\?['"]/g, '').replace(/\\\\/g, '\\')
            );
            const newId = Math.max(...database.departments.map(d => d.id)) + 1;

            const newDept = {
                id: newId,
                name: values[0] || '',
                manager: values[1] || ''
            };

            database.departments.push(newDept);
            return `部署が追加されました: ${newDept.name}`;
        }
    }

    throw new Error('INSERT文の解析に失敗しました。対応しているテーブル: users, orders, departments');
}

function processUpdate(query) {
    // 元のクエリを保持
    const originalQuery = query;

    // \n を実際の改行に変換し、エスケープされたクォートを処理
    const cleanQuery = query.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const sql = cleanQuery.toLowerCase().replace(/\s+/g, ' ');

    // デバッグ用（開発時のみ）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Original query:', originalQuery);
        console.log('Clean query:', cleanQuery);
        console.log('SQL:', sql);
    }

    if (sql.includes('update users')) {
        // より柔軟な正規表現パターン
        const setMatch = cleanQuery.match(/SET\s+(\w+)\s*=\s*['"]([^'"]+)['"]/i);
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (setMatch && whereMatch) {
            const field = setMatch[1];
            const value = setMatch[2];
            const id = parseInt(whereMatch[1]);

            const user = database.users.find(u => u.id === id);
            if (user) {
                user[field] = value;
                return `ユーザーID ${id} の ${field} を "${value}" に更新しました。`;
            } else {
                return `ユーザーID ${id} が見つかりませんでした。`;
            }
        } else {
            return `UPDATE文の構文解析に失敗しました。SET句またはWHERE句が正しくありません。`;
        }
    }

    // ordersテーブルの更新
    if (sql.includes('update orders')) {
        const setMatch = cleanQuery.match(/SET\s+(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (setMatch && whereMatch) {
            const field = setMatch[1];
            let value = setMatch[2];
            const id = parseInt(whereMatch[1]);

            // 数値フィールドの場合は数値に変換
            if (field === 'price' || field === 'user_id') {
                value = parseInt(value);
            }

            const order = database.orders.find(o => o.id === id);
            if (order) {
                order[field] = value;
                return `注文ID ${id} の ${field} を "${value}" に更新しました。`;
            } else {
                return `注文ID ${id} が見つかりませんでした。`;
            }
        } else {
            return `UPDATE文の構文解析に失敗しました。SET句またはWHERE句が正しくありません。`;
        }
    }

    // departmentsテーブルの更新
    if (sql.includes('update departments')) {
        const setMatch = cleanQuery.match(/SET\s+(\w+)\s*=\s*['"]([^'"]+)['"]/i);
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (setMatch && whereMatch) {
            const field = setMatch[1];
            const value = setMatch[2];
            const id = parseInt(whereMatch[1]);

            const dept = database.departments.find(d => d.id === id);
            if (dept) {
                dept[field] = value;
                return `部署ID ${id} の ${field} を "${value}" に更新しました。`;
            } else {
                return `部署ID ${id} が見つかりませんでした。`;
            }
        } else {
            return `UPDATE文の構文解析に失敗しました。SET句またはWHERE句が正しくありません。`;
        }
    }

    throw new Error('UPDATE文の解析に失敗しました。対応しているテーブル: users, orders, departments');
}

function processDelete(query) {
    // \n を実際の改行に変換し、エスケープされたクォートを処理
    const cleanQuery = query.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const sql = cleanQuery.toLowerCase().replace(/\s+/g, ' ');

    if (sql.includes('delete from users')) {
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (whereMatch) {
            const id = parseInt(whereMatch[1]);
            const index = database.users.findIndex(u => u.id === id);

            if (index !== -1) {
                const deletedUser = database.users.splice(index, 1)[0];
                return `ユーザー ${deletedUser.name} を削除しました。`;
            } else {
                return `ユーザーID ${id} が見つかりませんでした。`;
            }
        }
    }

    if (sql.includes('delete from orders')) {
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (whereMatch) {
            const id = parseInt(whereMatch[1]);
            const index = database.orders.findIndex(o => o.id === id);

            if (index !== -1) {
                const deletedOrder = database.orders.splice(index, 1)[0];
                return `注文ID ${id} (${deletedOrder.product_name}) を削除しました。`;
            } else {
                return `注文ID ${id} が見つかりませんでした。`;
            }
        }
    }

    if (sql.includes('delete from departments')) {
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (whereMatch) {
            const id = parseInt(whereMatch[1]);
            const index = database.departments.findIndex(d => d.id === id);

            if (index !== -1) {
                const deletedDept = database.departments.splice(index, 1)[0];
                return `部署 ${deletedDept.name} を削除しました。`;
            } else {
                return `部署ID ${id} が見つかりませんでした。`;
            }
        }
    }

    throw new Error('DELETE文の解析に失敗しました。対応しているテーブル: users, orders, departments');
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

// クエリ挿入機能
function insertQuery(queryTemplate) {
    if (editor) {
        editor.setValue(queryTemplate);
        editor.focus();
        // カーソルを末尾に移動
        editor.setCursor(editor.lineCount(), 0);
    }
}

// テーブル固有のクエリ生成
function generateTableQuery(tableName, action = 'select') {
    const schemas = {
        users: {
            columns: ['id', 'name', 'email', 'age', 'department'],
            primaryKey: 'id'
        },
        orders: {
            columns: ['id', 'user_id', 'product_name', 'price', 'order_date'],
            primaryKey: 'id'
        },
        departments: {
            columns: ['id', 'name', 'manager'],
            primaryKey: 'id'
        }
    };

    const schema = schemas[tableName];
    if (!schema) return '';

    switch (action) {
        case 'select':
            return `SELECT ${schema.columns.join(', ')}\nFROM ${tableName};`;
        case 'insert':
            const sampleValues = schema.columns.slice(1).map((col, index) => {
                if (col.includes('id') && col !== 'id') return '1';
                if (col.includes('age')) return '25';
                if (col.includes('price')) return '1000';
                if (col.includes('date')) return "'2024-01-01'";
                return `'sample_${col}'`;
            });
            return `INSERT INTO ${tableName} (${schema.columns.slice(1).join(', ')})\nVALUES (${sampleValues.join(', ')});`;
        case 'update':
            return `UPDATE ${tableName}\nSET ${schema.columns[1]} = 'new_value'\nWHERE ${schema.primaryKey} = 1;`;
        case 'delete':
            return `DELETE FROM ${tableName}\nWHERE ${schema.primaryKey} = 1;`;
        default:
            return '';
    }
}

// スマートクエリ補完機能
function smartQueryCompletion(currentQuery) {
    const query = currentQuery.toLowerCase().trim();

    // SELECT の場合
    if (query.startsWith('select') && !query.includes('from')) {
        return ['users', 'orders', 'departments'].map(table =>
            `${currentQuery} FROM ${table};`
        );
    }

    // WHERE句の提案
    if (query.includes('from users') && !query.includes('where')) {
        return [
            `${currentQuery} WHERE age > 25;`,
            `${currentQuery} WHERE department = '営業部';`,
            `${currentQuery} WHERE name LIKE '%田中%';`
        ];
    }

    return [];
}

// クエリ履歴機能
let queryHistory = [];
let historyIndex = -1;

function addToHistory(query) {
    if (query.trim() && !queryHistory.includes(query)) {
        queryHistory.unshift(query);
        if (queryHistory.length > 50) {
            queryHistory = queryHistory.slice(0, 50);
        }
    }
    historyIndex = -1;
}

function navigateHistory(direction) {
    if (queryHistory.length === 0) return;

    if (direction === 'up') {
        historyIndex = Math.min(historyIndex + 1, queryHistory.length - 1);
    } else {
        historyIndex = Math.max(historyIndex - 1, -1);
    }

    const query = historyIndex === -1 ? '' : queryHistory[historyIndex];
    if (editor) {
        editor.setValue(query);
        editor.focus();
    }
}

// オートコンプリート機能
function showAutoComplete() {
    if (!editor) return;

    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const currentWord = getCurrentWord(line, cursor.ch);
    const suggestions = getSuggestions(currentWord, line);

    if (suggestions.length > 0) {
        showSuggestions(suggestions, cursor);
    }
}

function getCurrentWord(line, pos) {
    const start = line.lastIndexOf(' ', pos - 1) + 1;
    const end = line.indexOf(' ', pos);
    return line.substring(start, end === -1 ? line.length : end);
}

function getSuggestions(word, line) {
    const suggestions = [];
    const lowerWord = word.toLowerCase();
    const lowerLine = line.toLowerCase();

    // SQLキーワード
    const sqlKeywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
        'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
        'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
        'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
        'AND', 'OR', 'NOT', 'LIKE', 'IN', 'BETWEEN'
    ];

    // テーブル名
    const tables = ['users', 'orders', 'departments'];

    // カラム名
    const columns = {
        users: ['id', 'name', 'email', 'age', 'department'],
        orders: ['id', 'user_id', 'product_name', 'price', 'order_date'],
        departments: ['id', 'name', 'manager']
    };

    // キーワード提案
    sqlKeywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(lowerWord)) {
            suggestions.push({
                text: keyword,
                displayText: keyword,
                className: 'autocomplete-keyword'
            });
        }
    });

    // テーブル名提案
    if (lowerLine.includes('from') || lowerLine.includes('join')) {
        tables.forEach(table => {
            if (table.toLowerCase().startsWith(lowerWord)) {
                suggestions.push({
                    text: table,
                    displayText: `${table} (table)`,
                    className: 'autocomplete-table'
                });
            }
        });
    }

    // カラム名提案
    Object.entries(columns).forEach(([tableName, tableCols]) => {
        if (lowerLine.includes(tableName)) {
            tableCols.forEach(col => {
                if (col.toLowerCase().startsWith(lowerWord)) {
                    suggestions.push({
                        text: col,
                        displayText: `${col} (${tableName})`,
                        className: 'autocomplete-column'
                    });
                }
            });
        }
    });

    return suggestions.slice(0, 10); // 最大10個まで
}

function showSuggestions(suggestions, cursor) {
    // 簡単な提案表示（実際のCodeMirrorのhint機能を使用）
    const hints = {
        list: suggestions,
        from: cursor,
        to: cursor
    };

    editor.showHint({
        hint: () => hints,
        completeSingle: false
    });
}