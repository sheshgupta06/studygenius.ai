import sqlite3
conn = sqlite3.connect('test.db')
c = conn.cursor()
c.execute("UPDATE documents SET status='ready' WHERE status IN ('processing','failed')")
print('Updated:', c.rowcount, 'documents to ready')
c.execute("SELECT id, title, status FROM documents")
for row in c.fetchall():
    print(row)
conn.commit()
conn.close()
