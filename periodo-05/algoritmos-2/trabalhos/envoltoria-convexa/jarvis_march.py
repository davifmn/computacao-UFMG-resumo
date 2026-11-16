from geometria import produto_vetorial, distancia

def ponto_inicial(pontos):
    """
    Encontra o ponto mais à esquerda (menor x).
    Em caso de empate, retorna o ponto com menor y(mais baixo).
    """
    pontos = list(pontos)

    left = pontos[0]
    for i in range(1, len(pontos)):
        p = pontos[i]

        if p[0] < left[0] or (p[0] == left[0] and p[1] < left[1]):
            left = p
    return left
    
def jarvis_march(pontos, left_most):
    """
    Retorna: Lista de pontos do fecho convexo em ordem anti-horária.
    """
    #if len(pontos) < 3:
    #    return pontos        
        
    pontos = list(pontos)
    fecho = [left_most]  
    current = left_most
    
    while True:
        next_point = None  
        
        for candidate in pontos:
            if candidate == current:
                continue
            if next_point is None:
                next_point = candidate
                continue

            cross = produto_vetorial(current, next_point, candidate)
            if cross > 0:
                next_point = candidate
            elif cross == 0:  # Pontos colineares: escolhe o ponto mais distante
                if distancia(current, candidate) > distancia(current, next_point):
                    next_point = candidate          
            
        fecho.append(next_point)
        current = next_point
        
        if next_point == left_most:
            break   # completou o ciclo
        
    return fecho