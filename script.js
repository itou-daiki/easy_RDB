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
            "Ctrl-Space": showAutoComplete,
            "Ctrl-Shift-F": formatSQL
        }
    });

    editor.setValue("SELECT * FROM users;\n\n-- ここにSQLクエリを入力してください\n-- 例: SELECT name, email FROM users WHERE age > 25;");
    editor.focus();

    // 実行履歴を読み込む
    loadQueryHistory();
});

// インメモリデータベース
let database = {
    users: [
        { id: 1, name: '田中太郎', email: 'tanaka@example.com', age: 28, department: '営業部' },
        { id: 2, name: '佐藤花子', email: 'sato@example.com', age: 32, department: '開発部' },
        { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', age: 26, department: '営業部' },
        { id: 4, name: '高橋美咲', email: 'takahashi@example.com', age: 35, department: '人事部' },
        { id: 5, name: '山田健太', email: 'yamada@example.com', age: 29, department: '開発部' },
        { id: 6, name: '伊藤美穂', email: 'ito@example.com', age: 24, department: '営業部' },
        { id: 7, name: '渡辺良太', email: 'watanabe@example.com', age: 31, department: '開発部' },
        { id: 8, name: '中村京子', email: 'nakamura@example.com', age: 27, department: '人事部' },
        { id: 9, name: '小林達也', email: 'kobayashi@example.com', age: 33, department: '営業部' },
        { id: 10, name: '加藤千春', email: 'kato@example.com', age: 30, department: '開発部' },
        { id: 11, name: '松本雅彦', email: 'matsumoto@example.com', age: 25, department: 'マーケティング部' },
        { id: 12, name: '井上由美', email: 'inoue@example.com', age: 34, department: 'マーケティング部' },
        { id: 13, name: '木村秀樹', email: 'kimura@example.com', age: 29, department: '経理部' },
        { id: 14, name: '斎藤結愛', email: 'saito@example.com', age: 26, department: '経理部' },
        { id: 15, name: '林大輔', email: 'hayashi@example.com', age: 38, department: '営業部' },
        { id: 16, name: '森田真理', email: 'morita@example.com', age: 23, department: '開発部' },
        { id: 17, name: '橋本和也', email: 'hashimoto@example.com', age: 36, department: '人事部' },
        { id: 18, name: '青木恵子', email: 'aoki@example.com', age: 31, department: 'マーケティング部' },
        { id: 19, name: '山口誠', email: 'yamaguchi@example.com', age: 27, department: '営業部' },
        { id: 20, name: '清水香織', email: 'shimizu@example.com', age: 32, department: '経理部' }
    ],
    orders: [
        { id: 1, user_id: 1, product_name: 'ノートPC', price: 80000, order_date: '2024-01-15' },
        { id: 2, user_id: 2, product_name: 'マウス', price: 3000, order_date: '2024-01-20' },
        { id: 3, user_id: 1, product_name: 'キーボード', price: 8000, order_date: '2024-02-01' },
        { id: 4, user_id: 3, product_name: 'モニター', price: 25000, order_date: '2024-02-10' },
        { id: 5, user_id: 4, product_name: 'プリンター', price: 15000, order_date: '2024-02-15' },
        { id: 6, user_id: 5, product_name: 'Webカメラ', price: 12000, order_date: '2024-02-20' },
        { id: 7, user_id: 6, product_name: 'スピーカー', price: 8500, order_date: '2024-02-25' },
        { id: 8, user_id: 2, product_name: 'ヘッドセット', price: 15000, order_date: '2024-03-01' },
        { id: 9, user_id: 7, product_name: 'タブレット', price: 45000, order_date: '2024-03-05' },
        { id: 10, user_id: 8, product_name: 'マウスパッド', price: 2000, order_date: '2024-03-10' },
        { id: 11, user_id: 9, product_name: 'デスクライト', price: 6000, order_date: '2024-03-15' },
        { id: 12, user_id: 3, product_name: 'USBメモリ', price: 3500, order_date: '2024-03-20' },
        { id: 13, user_id: 10, product_name: 'SSD', price: 18000, order_date: '2024-03-25' },
        { id: 14, user_id: 11, product_name: 'スマートフォン', price: 95000, order_date: '2024-04-01' },
        { id: 15, user_id: 1, product_name: 'モニターアーム', price: 12000, order_date: '2024-04-05' },
        { id: 16, user_id: 12, product_name: 'キーボード', price: 8000, order_date: '2024-04-10' },
        { id: 17, user_id: 13, product_name: '電卓', price: 4500, order_date: '2024-04-15' },
        { id: 18, user_id: 14, product_name: 'ファイル', price: 1200, order_date: '2024-04-20' },
        { id: 19, user_id: 15, product_name: 'ホワイトボード', price: 8500, order_date: '2024-04-25' },
        { id: 20, user_id: 5, product_name: '外付けHDD', price: 22000, order_date: '2024-05-01' },
        { id: 21, user_id: 16, product_name: 'コーヒーメーカー', price: 15000, order_date: '2024-05-05' },
        { id: 22, user_id: 17, product_name: 'シュレッダー', price: 12000, order_date: '2024-05-10' },
        { id: 23, user_id: 18, product_name: 'プロジェクター', price: 65000, order_date: '2024-05-15' },
        { id: 24, user_id: 19, product_name: 'ドキュメントスキャナ', price: 35000, order_date: '2024-05-20' },
        { id: 25, user_id: 20, product_name: '会計ソフト', price: 50000, order_date: '2024-05-25' },
        { id: 26, user_id: 7, product_name: 'ノートPC', price: 85000, order_date: '2024-06-01' },
        { id: 27, user_id: 4, product_name: 'マウス', price: 3500, order_date: '2024-06-05' },
        { id: 28, user_id: 9, product_name: 'モニター', price: 28000, order_date: '2024-06-10' },
        { id: 29, user_id: 6, product_name: 'デスクチェア', price: 45000, order_date: '2024-06-15' },
        { id: 30, user_id: 11, product_name: 'マーケティングツール', price: 120000, order_date: '2024-06-20' }
    ],
    departments: [
        { id: 1, name: '営業部', manager: '営業部長' },
        { id: 2, name: '開発部', manager: '技術部長' },
        { id: 3, name: '人事部', manager: '人事部長' },
        { id: 4, name: 'マーケティング部', manager: 'マーケティング部長' },
        { id: 5, name: '経理部', manager: '経理部長' }
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
    saveToQueryHistory(query);

    // ER図で使用されているテーブルをハイライト
    highlightTablesInQuery(query);

    try {
        const result = processSQL(query);
        displayResult(result);
    } catch (error) {
        showFriendlyError(error, query);
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
        let result = [...database.departments];
        if (sql.includes('where')) {
            result = filterData(result, query);
        }
        return result;
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

    if (sql.includes('from orders')) {
        return processColumnSelect(query, 'orders');
    }

    if (sql.includes('from departments')) {
        return processColumnSelect(query, 'departments');
    }

    throw new Error('クエリを解析できませんでした。より簡単なクエリを試してください。');
}

function filterData(data, query) {
    const sql = query.toLowerCase();

    // 年齢の条件
    if (sql.includes('age >')) {
        const ageMatch = query.match(/age\s*>\s*(\d+)/i);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            return data.filter(item => item.age && item.age > age);
        }
    }

    if (sql.includes('age <')) {
        const ageMatch = query.match(/age\s*<\s*(\d+)/i);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            return data.filter(item => item.age && item.age < age);
        }
    }

    if (sql.includes('age =')) {
        const ageMatch = query.match(/age\s*=\s*(\d+)/i);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            return data.filter(item => item.age === age);
        }
    }

    // 価格の条件
    if (sql.includes('price >')) {
        const priceMatch = query.match(/price\s*>\s*(\d+)/i);
        if (priceMatch) {
            const price = parseInt(priceMatch[1]);
            return data.filter(item => item.price && item.price > price);
        }
    }

    if (sql.includes('price <')) {
        const priceMatch = query.match(/price\s*<\s*(\d+)/i);
        if (priceMatch) {
            const price = parseInt(priceMatch[1]);
            return data.filter(item => item.price && item.price < price);
        }
    }

    // 部署の条件
    if (sql.includes('department =')) {
        const deptMatch = query.match(/department\s*=\s*['"]([^'"]+)['"]/i);
        if (deptMatch) {
            const dept = deptMatch[1];
            return data.filter(item => item.department === dept);
        }
    }

    // 商品名の条件
    if (sql.includes('product_name =')) {
        const productMatch = query.match(/product_name\s*=\s*['"]([^'"]+)['"]/i);
        if (productMatch) {
            const product = productMatch[1];
            return data.filter(item => item.product_name === product);
        }
    }

    // LIKE条件
    if (sql.includes('like')) {
        const likeMatch = query.match(/(\w+)\s+like\s+['"]([^'"]+)['"]/i);
        if (likeMatch) {
            const column = likeMatch[1];
            const pattern = likeMatch[2].replace(/%/g, '.*');
            const regex = new RegExp(pattern, 'i');
            return data.filter(item => {
                const value = item[column];
                return value && regex.test(String(value));
            });
        }
    }

    // ID条件
    if (sql.includes('id =')) {
        const idMatch = query.match(/id\s*=\s*(\d+)/i);
        if (idMatch) {
            const id = parseInt(idMatch[1]);
            return data.filter(item => item.id === id);
        }
    }

    if (sql.includes('user_id =')) {
        const userIdMatch = query.match(/user_id\s*=\s*(\d+)/i);
        if (userIdMatch) {
            const userId = parseInt(userIdMatch[1]);
            return data.filter(item => item.user_id === userId);
        }
    }

    // name条件（departments用）
    if (sql.includes('name =')) {
        const nameMatch = query.match(/name\s*=\s*['"]([^'"]+)['"]/i);
        if (nameMatch) {
            const name = nameMatch[1];
            return data.filter(item => item.name === name);
        }
    }

    // manager条件
    if (sql.includes('manager =')) {
        const managerMatch = query.match(/manager\s*=\s*['"]([^'"]+)['"]/i);
        if (managerMatch) {
            const manager = managerMatch[1];
            return data.filter(item => item.manager === manager);
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
    let data = [...database[table]];

    // WHERE句があれば先にフィルタリング
    if (sql.includes('where')) {
        data = filterData(data, query);
    }

    // ORDER BY句の処理
    if (sql.includes('order by')) {
        data = processOrderBy(data, query);
    }

    // SELECT文から列名を抽出する改良版
    const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i);
    if (selectMatch) {
        const columnsStr = selectMatch[1].trim();

        // * の場合は全データ
        if (columnsStr === '*') {
            return data;
        }

        // カラム名を分割（カンマで区切られた）
        const columns = columnsStr.split(',').map(col => col.trim());

        // 各行について指定されたカラムのみを抽出
        return data.map(row => {
            const result = {};
            columns.forEach(col => {
                if (row.hasOwnProperty(col)) {
                    result[col] = row[col];
                }
            });
            return result;
        });
    }

    return data;
}

// ORDER BY処理を追加
function processOrderBy(data, query) {
    const orderMatch = query.match(/ORDER\s+BY\s+(\w+)(\s+(ASC|DESC))?/i);
    if (orderMatch) {
        const column = orderMatch[1];
        const direction = orderMatch[3] ? orderMatch[3].toUpperCase() : 'ASC';

        return data.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // 数値の場合は数値として比較
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return direction === 'ASC' ? aVal - bVal : bVal - aVal;
            }

            // 文字列の場合は文字列として比較
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();

            if (direction === 'ASC') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
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
        const setMatch = cleanQuery.match(/SET\s+(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
        const whereMatch = cleanQuery.match(/WHERE\s+id\s*=\s*(\d+)/i);

        if (setMatch && whereMatch) {
            const field = setMatch[1];
            let value = setMatch[2];
            const id = parseInt(whereMatch[1]);

            // 数値フィールドの場合は数値に変換し、変換できない場合はエラー
            if (field === 'age') {
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                    return `エラー: ${field} フィールドには数値を指定してください。入力値: "${value}"`;
                }
                value = numValue;
            }

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

            // 数値フィールドの場合は数値に変換し、変換できない場合はエラー
            if (field === 'price' || field === 'user_id') {
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                    return `エラー: ${field} フィールドには数値を指定してください。入力値: "${value}"`;
                }
                value = numValue;
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
    resultArea.classList.remove('hidden');

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
    resultArea.classList.remove('hidden');
    queryResult.innerHTML = `<div class="${type}" style="margin: 15px;">${message}</div>`;
}

function clearEditor() {
    if (editor) {
        editor.setValue('');
    }
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('queryResult').innerHTML = '';
}

// クエリ挿入機能
function insertQuery(queryTemplate) {
    if (editor) {
        // エスケープされた改行文字とクォートを実際の文字に変換
        const cleanQuery = queryTemplate.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
        editor.setValue(cleanQuery);
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
                if (col === 'manager') return "'新部長'";
                if (col === 'name' && tableName === 'departments') return "'新部署'";
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

// ER図の表示/非表示を切り替え
function toggleERDiagram() {
    const container = document.getElementById('erDiagramContainer');
    const button = document.getElementById('toggleERDiagram');

    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.innerHTML = '<span>👁️</span>非表示';
        // アニメーション効果
        container.style.opacity = '0';
        container.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            container.style.transition = 'all 0.3s ease';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 10);
    } else {
        container.style.transition = 'all 0.3s ease';
        container.style.opacity = '0';
        container.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            container.style.display = 'none';
            button.innerHTML = '<span>👁️</span>表示';
        }, 300);
    }
}

// ER図のテーブルクリック処理
function handleTableClick(tableName) {
    // 対応するクエリを自動挿入
    const queries = {
        users: 'SELECT * FROM users;',
        orders: 'SELECT * FROM orders;',
        departments: 'SELECT * FROM departments;'
    };

    if (queries[tableName] && editor) {
        editor.setValue(queries[tableName]);
        editor.focus();

        // テーブルをハイライト
        highlightTable(tableName);
    }
}

// テーブルハイライト効果
function highlightTable(tableName) {
    // 全テーブルのハイライトをリセット
    document.querySelectorAll('.table-entity').forEach(entity => {
        entity.classList.remove('highlighted');
    });

    // 指定されたテーブルをハイライト
    const targetEntity = document.querySelector(`[data-table="${tableName}"]`);
    if (targetEntity) {
        targetEntity.classList.add('highlighted');
        setTimeout(() => {
            targetEntity.classList.remove('highlighted');
        }, 2000);
    }
}

// ページ読み込み時にER図のイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
    // 既存のCodeMirror初期化コードの後に追加

    // ER図のテーブルエンティティにクリックイベントを追加
    document.querySelectorAll('.table-entity').forEach(entity => {
        entity.addEventListener('click', function() {
            const tableName = this.getAttribute('data-table');
            handleTableClick(tableName);
        });
    });

    // デフォルトでER図を表示状態にする
    const container = document.getElementById('erDiagramContainer');
    const button = document.getElementById('toggleERDiagram');
    container.style.display = 'block';
    button.innerHTML = '<span>👁️</span>非表示';
});

// ==================== 新機能: 学習支援機能 ====================

// クエリ実行履歴の管理
let executionHistory = [];

function saveToQueryHistory(query) {
    const timestamp = new Date().toLocaleString('ja-JP');
    const historyItem = {
        query: query,
        timestamp: timestamp
    };

    executionHistory.unshift(historyItem);

    // 最大50件まで保存
    if (executionHistory.length > 50) {
        executionHistory = executionHistory.slice(0, 50);
    }

    // localStorageに保存
    localStorage.setItem('queryHistory', JSON.stringify(executionHistory));

    // UIを更新
    updateHistoryDisplay();
}

function loadQueryHistory() {
    const stored = localStorage.getItem('queryHistory');
    if (stored) {
        executionHistory = JSON.parse(stored);
        updateHistoryDisplay();
    }
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');

    if (executionHistory.length === 0) {
        historyList.innerHTML = '<p class="text-center text-white text-opacity-70 py-4 text-sm">まだ履歴がありません</p>';
        return;
    }

    let html = '';
    executionHistory.slice(0, 10).forEach((item, index) => {
        const shortQuery = item.query.length > 50
            ? item.query.substring(0, 50) + '...'
            : item.query;

        html += `
            <div class="history-item bg-white rounded-lg p-3 mb-2 cursor-pointer transition-all hover:bg-gray-50 hover:shadow-md hover:translate-x-1" onclick="loadFromHistory(${index})">
                <div class="text-sm text-gray-700 font-mono mb-1">${escapeHtml(shortQuery)}</div>
                <div class="text-xs text-gray-500">${item.timestamp}</div>
            </div>
        `;
    });

    historyList.innerHTML = html;
}

function loadFromHistory(index) {
    const item = executionHistory[index];
    if (item && editor) {
        editor.setValue(item.query);
        editor.focus();
    }
}

function clearHistory() {
    if (confirm('実行履歴を全て削除しますか？')) {
        executionHistory = [];
        localStorage.removeItem('queryHistory');
        updateHistoryDisplay();
    }
}

// SQLフォーマット機能
function formatSQL() {
    if (!editor) return;

    const query = editor.getValue().trim();
    if (!query) return;

    // 基本的なSQLフォーマット
    let formatted = query
        // 複数の空白を1つに
        .replace(/\s+/g, ' ')
        // 主要キーワードの前で改行
        .replace(/\s+(SELECT|FROM|WHERE|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM)\s+/gi, '\n$1 ')
        // ANDとORの前で改行（ただしBETWEEN ANDは除く）
        .replace(/\s+(AND|OR)\s+(?!AND)/gi, '\n  $1 ')
        // カンマの後にスペース
        .replace(/,/g, ', ')
        // セミコロンの前の空白を削除
        .replace(/\s*;/g, ';')
        // 先頭の改行を削除
        .trim();

    // インデント調整
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentedLines = lines.map(line => {
        const trimmed = line.trim();

        // インデントを減らすキーワード
        if (trimmed.match(/^(FROM|WHERE|GROUP BY|ORDER BY|HAVING)/i)) {
            indentLevel = 1;
        } else if (trimmed.match(/^(AND|OR)/i)) {
            indentLevel = 2;
        } else if (trimmed.match(/^SELECT/i)) {
            indentLevel = 0;
        }

        const indent = '  '.repeat(indentLevel);
        return indent + trimmed;
    });

    formatted = indentedLines.join('\n');

    editor.setValue(formatted);
    showResult('SQLをフォーマットしました。', 'success');
}

// クエリ説明機能
function explainQuery() {
    if (!editor) return;

    const query = editor.getValue().trim();
    if (!query) {
        showResult('説明するSQLクエリを入力してください。', 'error');
        return;
    }

    const explanation = generateExplanation(query);

    const explanationArea = document.getElementById('explanationArea');
    const explanationContent = document.getElementById('explanationContent');

    explanationContent.innerHTML = explanation;
    explanationArea.classList.remove('hidden');

    // スクロールして表示
    explanationArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generateExplanation(query) {
    const sql = query.toLowerCase();
    let explanation = '<div class="explanation-text">';

    // クエリタイプの判定
    if (sql.startsWith('select')) {
        explanation += '<h4>📖 SELECT文（データの取得）</h4>';
        explanation += '<p>このクエリはデータベースからデータを<strong>取得</strong>します。</p>';

        // テーブルの特定
        const tables = [];
        if (sql.includes('from users')) tables.push('users');
        if (sql.includes('from orders')) tables.push('orders');
        if (sql.includes('from departments')) tables.push('departments');

        if (tables.length > 0) {
            explanation += `<p>📊 使用テーブル: <strong>${tables.join(', ')}</strong></p>`;
        }

        // JOINの説明
        if (sql.includes('join')) {
            explanation += '<p>🔗 <strong>JOIN</strong>: 複数のテーブルを関連付けてデータを取得しています。';
            explanation += '関連するデータを組み合わせて、より詳細な情報を得ることができます。</p>';
        }

        // WHERE句の説明
        if (sql.includes('where')) {
            explanation += '<p>🔍 <strong>WHERE</strong>: 条件に合うデータのみを絞り込んでいます。';

            if (sql.includes('age >') || sql.includes('age <')) {
                explanation += '年齢による条件指定をしています。';
            }
            if (sql.includes('department =')) {
                explanation += '特定の部署のデータのみを取得しています。';
            }
            explanation += '</p>';
        }

        // GROUP BYの説明
        if (sql.includes('group by')) {
            explanation += '<p>📊 <strong>GROUP BY</strong>: データをグループ化して集計しています。';
            explanation += '同じ値を持つ行をまとめて、COUNT、SUM、AVGなどの集約関数を使えます。</p>';
        }

        // ORDER BYの説明
        if (sql.includes('order by')) {
            explanation += '<p>⬆️⬇️ <strong>ORDER BY</strong>: 結果を並べ替えています。';
            if (sql.includes('desc')) {
                explanation += '降順（大きい順）に並べています。';
            } else {
                explanation += '昇順（小さい順）に並べています。';
            }
            explanation += '</p>';
        }

        // 集約関数の説明
        if (sql.includes('count')) {
            explanation += '<p>🔢 <strong>COUNT</strong>: レコードの件数を数えています。</p>';
        }
        if (sql.includes('sum')) {
            explanation += '<p>➕ <strong>SUM</strong>: 数値の合計を計算しています。</p>';
        }
        if (sql.includes('avg')) {
            explanation += '<p>📈 <strong>AVG</strong>: 数値の平均値を計算しています。</p>';
        }

    } else if (sql.startsWith('insert')) {
        explanation += '<h4>➕ INSERT文（データの追加）</h4>';
        explanation += '<p>このクエリはデータベースに新しいデータを<strong>追加</strong>します。</p>';
        explanation += '<p>⚠️ 実行すると新しい行がテーブルに追加されます。</p>';

    } else if (sql.startsWith('update')) {
        explanation += '<h4>✏️ UPDATE文（データの更新）</h4>';
        explanation += '<p>このクエリは既存のデータを<strong>変更</strong>します。</p>';

        if (sql.includes('where')) {
            explanation += '<p>✅ WHERE句で条件を指定しているので、条件に合うデータのみが更新されます。</p>';
        } else {
            explanation += '<p>⚠️ <strong>注意！</strong> WHERE句がないため、テーブルの<strong>全データ</strong>が更新されます！</p>';
        }

    } else if (sql.startsWith('delete')) {
        explanation += '<h4>🗑️ DELETE文（データの削除）</h4>';
        explanation += '<p>このクエリはデータを<strong>削除</strong>します。</p>';

        if (sql.includes('where')) {
            explanation += '<p>✅ WHERE句で条件を指定しているので、条件に合うデータのみが削除されます。</p>';
        } else {
            explanation += '<p>⚠️ <strong>危険！</strong> WHERE句がないため、テーブルの<strong>全データ</strong>が削除されます！</p>';
        }
    }

    explanation += '</div>';

    return explanation;
}

// ER図のテーブルハイライト（クエリ実行時）
function highlightTablesInQuery(query) {
    const sql = query.toLowerCase();

    // 全テーブルのハイライトをリセット
    document.querySelectorAll('.table-entity').forEach(entity => {
        entity.classList.remove('highlighted');
    });

    // 使用されているテーブルをハイライト
    const tables = ['users', 'orders', 'departments'];
    tables.forEach(table => {
        if (sql.includes(table)) {
            const entity = document.querySelector(`[data-table="${table}"]`);
            if (entity) {
                entity.classList.add('highlighted');

                // 2秒後にハイライトを解除
                setTimeout(() => {
                    entity.classList.remove('highlighted');
                }, 2000);
            }
        }
    });
}

// 親切なエラーメッセージ
function showFriendlyError(error, query) {
    const sql = query.toLowerCase();
    let friendlyMessage = `エラー: ${error.message}`;
    let hint = '';

    // よくあるエラーパターンに対するヒント
    if (error.message.includes('解析できませんでした')) {
        hint = '<p><strong>💡 ヒント:</strong></p><ul>';
        hint += '<li>SQLの構文が正しいか確認してください</li>';
        hint += '<li>テーブル名やカラム名のスペルを確認してください</li>';
        hint += '<li>クォート（\'または"）が正しく閉じられているか確認してください</li>';
        hint += '</ul>';
    }

    if (sql.includes('update') && !sql.includes('where')) {
        hint = '<p><strong>⚠️ 警告:</strong> UPDATE文にWHERE句がありません。全データが更新されますが、本当に実行しますか？</p>';
    }

    if (sql.includes('delete') && !sql.includes('where')) {
        hint = '<p><strong>⚠️ 危険:</strong> DELETE文にWHERE句がありません。全データが削除されますが、本当に実行しますか？</p>';
    }

    showResult(friendlyMessage + hint, 'error');
}

// HTMLエスケープ関数
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}