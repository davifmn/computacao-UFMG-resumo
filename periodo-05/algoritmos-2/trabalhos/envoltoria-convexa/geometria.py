"""Utilitários geométricos usados pelos dois algoritmos de envoltória convexa."""


def produto_vetorial(p1, p2, p3):
    """
    Calcula o produto vetorial entre os vetores (p2 - p1) e (p3 - p1).
    Valor positivo: p3 está à esquerda da linha (p1->p2)
    Valor negativo: p3 está à direita
    Zero: pontos colineares
    """
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])

def distancia(p1, p2):
    """Distância euclidiana AO QUADRADO entre dois pontos (x, y)."""
    dx = p1[0] - p2[0]
    dy = p1[1] - p2[1]
    return dx * dx + dy * dy  # distância ao quadrado: basta para comparar