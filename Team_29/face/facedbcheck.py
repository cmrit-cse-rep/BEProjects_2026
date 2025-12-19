import sqlite3

def count_faces():
    conn = sqlite3.connect('faces.db')
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute('SELECT COUNT(*) FROM faces')
    total = cursor.fetchone()[0]
    
    # Get unique names
    cursor.execute('SELECT DISTINCT name FROM faces')
    names = cursor.fetchall()
    
    conn.close()
    
    print(f"📊 Total face records: {total}")
    print(f"👥 Unique people: {len(names)}")
    print(f"\n📝 Registered names:")
    for name in names:
        cursor = sqlite3.connect('faces.db').cursor()
        cursor.execute('SELECT COUNT(*) FROM faces WHERE name=?', (name[0],))
        count = cursor.fetchone()[0]
        print(f"  - {name[0]}: {count} record(s)")

if __name__ == "__main__":
    count_faces()