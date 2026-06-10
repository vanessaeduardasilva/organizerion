from database import get_connection


def atualizar_conta(conta_id: int, descricao: str, valor: float, vencimento: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE contas SET descricao = ?, valor = ?, vencimento = ? WHERE id = ?",
            (descricao, valor, vencimento, conta_id)
        )
        conn.commit()
