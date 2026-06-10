from models.conta import Conta, TipoConta
from database import buscar_contas_por_usuario


def listar_contas_usuario(usuario_id: int):
    rows = buscar_contas_por_usuario(usuario_id)
    return [
        Conta(
            id=r["id"],
            usuario_id=usuario_id,
            descricao=r["descricao"],
            valor=r["valor"],
            vencimento=r["vencimento"],
            tipo=TipoConta(r["tipo"]),
            parcela_atual=r["parcela_atual"],
            total_parcelas=r["total_parcelas"],
            sincronizado=bool(r["sincronizado"])
        )
        for r in rows
    ]
