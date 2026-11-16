"""Os agentes, separados nas duas famílias."""
from .deterministicos import DETERMINISTICOS
from .nao_deterministicos import NAO_DETERMINISTICOS

FAMILIAS = {"Determinísticos": DETERMINISTICOS, "Não determinísticos": NAO_DETERMINISTICOS}
