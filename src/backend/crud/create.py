from database import salvar_usuario_no_banco, salvar_conta_no_banco
from models.usuario import Usuario
from models.conta import Conta


def criar_usuario(nome: str, email: str) -> int:
    usuario = Usuario(id=None, nome=nome, email=email)
    return salvar_usuario_no_banco(usuario)


def criar_conta(conta: Conta) -> None:
    salvar_conta_no_banco(conta)
