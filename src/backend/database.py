import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "gestor_contas.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS contas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            vencimento DATE NOT NULL,
            tipo TEXT NOT NULL,
            parcela_atual INTEGER DEFAULT 1,
            total_parcelas INTEGER DEFAULT 1,
            sincronizado INTEGER DEFAULT 0,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        );
        """)

    print(f"banco de dados pronto: {DB_PATH}")


def salvar_usuario_no_banco(usuario_obj):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO usuarios (nome, email) VALUES (?, ?)",
            (usuario_obj.nome, usuario_obj.email)
        )
        conn.commit()
        return cursor.lastrowid


def salvar_conta_no_banco(conta_obj):
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO contas (
                usuario_id, descricao, valor, vencimento,
                tipo, parcela_atual, total_parcelas, sincronizado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            conta_obj.usuario_id,
            conta_obj.descricao,
            conta_obj.valor,
            conta_obj.vencimento.isoformat(),
            conta_obj.tipo.value,
            conta_obj.parcela_atual,
            conta_obj.total_parcelas,
            1 if conta_obj.sincronizado else 0
        ))
        conn.commit()


def buscar_todos_usuarios():
    with get_connection() as conn:
        return conn.execute("SELECT id, nome, email FROM usuarios ORDER BY nome").fetchall()


def buscar_usuario_por_id(usuario_id):
    with get_connection() as conn:
        return conn.execute(
            "SELECT id, nome, email FROM usuarios WHERE id = ?", (usuario_id,)
        ).fetchone()


def buscar_usuario_por_email(email):
    with get_connection() as conn:
        return conn.execute(
            "SELECT id, nome, email FROM usuarios WHERE email = ?", (email,)
        ).fetchone()


def buscar_contas_por_usuario(usuario_id):
    with get_connection() as conn:
        return conn.execute("""
            SELECT id, descricao, valor, vencimento, tipo,
                   parcela_atual, total_parcelas, sincronizado
            FROM contas
            WHERE usuario_id = ?
            ORDER BY vencimento
        """, (usuario_id,)).fetchall()


def buscar_conta_por_id(conta_id):
    with get_connection() as conn:
        return conn.execute("SELECT * FROM contas WHERE id = ?", (conta_id,)).fetchone()


def buscar_contas_por_vencimento(data_inicio, data_fim):
    with get_connection() as conn:
        return conn.execute("""
            SELECT contas.id, usuarios.nome AS usuario, contas.descricao,
                   contas.valor, contas.vencimento, contas.tipo
            FROM contas
            JOIN usuarios ON contas.usuario_id = usuarios.id
            WHERE vencimento BETWEEN ? AND ?
            ORDER BY vencimento
        """, (data_inicio, data_fim)).fetchall()


def atualizar_conta(conta_obj):
    with get_connection() as conn:
        conn.execute("""
            UPDATE contas
            SET descricao = ?, valor = ?, vencimento = ?, tipo = ?,
                parcela_atual = ?, total_parcelas = ?, sincronizado = ?
            WHERE id = ?
        """, (
            conta_obj.descricao,
            conta_obj.valor,
            conta_obj.vencimento.isoformat(),
            conta_obj.tipo.value,
            conta_obj.parcela_atual,
            conta_obj.total_parcelas,
            1 if conta_obj.sincronizado else 0,
            conta_obj.id
        ))
        conn.commit()


def marcar_conta_como_sincronizada(conta_id):
    with get_connection() as conn:
        conn.execute("UPDATE contas SET sincronizado = 1 WHERE id = ?", (conta_id,))
        conn.commit()


def deletar_conta(conta_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM contas WHERE id = ?", (conta_id,))
        conn.commit()


def deletar_usuario(usuario_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM usuarios WHERE id = ?", (usuario_id,))
        conn.commit()


if __name__ == "__main__":
    init_db()
