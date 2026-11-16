import matplotlib.pyplot as plt

def plot_pontos(pontos):
    """
    Plota os pontos fornecidos em um gráfico 2D.
    
    :param pontos: Lista de tuplas (x, y) representando os pontos a serem plotados.
    """
    x, y = zip(*pontos)
    plt.scatter(x, y, color='blue', label='Pontos')
    plt.xlabel('X')
    plt.ylabel('Y')
    plt.title('Pontos no Plano')
    plt.legend()
    plt.grid(True)
    plt.show()


def plot_fecho_convexo(pontos, fecho_convexo):
    """
    Plota o fecho convexo mínimo formado pelos pontos fornecidos.
    
    :param pontos: Lista de tuplas (x, y) representando os pontos a serem plotados.
    :param fecho_convexo: Lista de tuplas (x, y) representando os pontos do fecho convexo.
    """
    x, y = zip(*pontos)
    plt.scatter(x, y, color='blue', label='Pontos')
    
    # Desenha o fecho convexo
    fecho_x, fecho_y = zip(*fecho_convexo)
    plt.fill(fecho_x, fecho_y, color='orange', alpha=0.5, label='Fecho Convexo')
    
    plt.xlabel('X')
    plt.ylabel('Y')
    plt.title('Fecho Convexo Mínimo')
    plt.legend()
    plt.grid(True)
    plt.show()
    
def plot_fecho_convexo_animado(pontos, fecho_convexo):
    """
    Plota o fecho convexo mínimo formado pelos pontos fornecidos de forma animada.
    :param pontos: Lista de tuplas (x, y) representando os pontos a serem plotados.
    :param fecho_convexo: Lista de tuplas (x, y) representando os pontos do fecho convexo.
    """
    x, y = zip(*pontos)
    plt.scatter(x, y, color='blue', label='Pontos')
    
    # Desenha o fecho convexo
    fecho_x, fecho_y = zip(*fecho_convexo)
    plt.fill(fecho_x, fecho_y, color='orange', alpha=0.5, label='Fecho Convexo')
    
    plt.xlabel('X')
    plt.ylabel('Y')
    plt.title('Fecho Convexo Mínimo (Animação)')
    plt.grid(True)
    
    for i in range(len(fecho_convexo) - 1):
        plt.plot([fecho_convexo[i][0], fecho_convexo[i + 1][0]], 
                 [fecho_convexo[i][1], fecho_convexo[i + 1][1]], color='red', linewidth=2)
        plt.pause(0.7)  # Pausa para animação
    
    plt.show()





