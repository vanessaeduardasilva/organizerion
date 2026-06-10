from dataclasses import dataclass
from datetime import date
from enum import Enum
from typing import Optional


class TipoConta(str, Enum):
    FIXA = "fixa"
    ESPORADICA = "esporadica"
    PARCELADA = "parcelada"


@dataclass
class Conta:
    id: Optional[int]
    usuario_id: int
    descricao: str
    valor: float
    vencimento: date
    tipo: TipoConta
    parcela_atual: int = 1
    total_parcelas: int = 1
    sincronizado: bool = False
