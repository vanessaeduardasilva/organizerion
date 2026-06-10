from database import get_connection


def deletar_conta_por_id(conta_id: int) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contas WHERE id = ?", (conta_id,))
    conn.commit()
    conn.close()
