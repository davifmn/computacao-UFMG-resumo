import pygame
import json
from carro import Carro

class Pista():
    BLACK = (0, 0, 0)
    WHITE = (255, 255, 255)
    GREEN = (0, 255, 0)
    RED = (255, 0, 0)
    WIDTH = 1920
    HEIGHT = 1080

    def __init__(self, window):
        self.window = window
        self.window_width = self.WIDTH
        self.window_height = self.HEIGHT
        self.largada = None
        self.chegada = None
        self.clicks_count = 0
        self.drawing = False
        self.last_pos = None
        self.pontos_pista = []  # ← Aqui os pontos do percurso

    def draw_pista_user(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if self.clicks_count == 0:
                    self.largada = event.pos
                    pygame.draw.circle(self.window, self.GREEN, self.largada, 45)
                    self.clicks_count += 1

                elif self.clicks_count == 1:
                    self.drawing = True
                    self.last_pos = event.pos

                elif self.clicks_count == 2:
                    self.chegada = event.pos
                    pygame.draw.circle(self.window, self.RED, self.chegada, 45)
                    self.clicks_count += 1

                    # ✅ Salva os dados em arquivo JSON
                    self.salvar_pista()

                    return False  # Encerra o loop

            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                if self.drawing and self.clicks_count == 1:
                    self.drawing = False
                    self.clicks_count += 1
                    self.last_pos = None

            elif event.type == pygame.MOUSEMOTION and self.drawing and self.clicks_count == 1:
                current_pos = event.pos
                if self.last_pos:
                    
                    """ Desenha a linha entre os pontos mas deixa falhas!!!!
                    pygame.draw.line(self.window, self.WHITE, self.last_pos, current_pos, 9)
                    self.pontos_pista.append(current_pos)
                    """

                    # Interpola os pontos intermediários suavemente renderizando melhor
                    x1, y1 = self.last_pos
                    x2, y2 = current_pos
                    dx = x2 - x1
                    dy = y2 - y1
                    dist = max(abs(dx), abs(dy))

                    for i in range(dist + 1):
                        x = int(x1 + dx * i / dist)
                        y = int(y1 + dy * i / dist)
                        pygame.draw.circle(self.window, self.WHITE, (x, y), 40)
                        self.pontos_pista.append((x, y))
                self.last_pos = current_pos

                

        return True

    def salvar_pista(self):
        pygame.image.save(self.window, "assets/pista.png")
        dados = {
            "largada": self.largada,
            "chegada": self.chegada,
            "pontos_pista": self.pontos_pista
        }
        with open("assets/pista.json", "w") as f:
            json.dump(dados, f)
        print("Pista salva em assets/pista.json ✅")



    def carregar_pista(window):
        """" ate o momento esse metodo nao foi necessario"""
        try:
            with open("assets/pista.json", "r") as f:
                dados = json.load(f)
        except FileNotFoundError:
            print("❌ Arquivo 'assets/pista.json' não encontrado.")
            return

        largada = tuple(dados["largada"])
        chegada = tuple(dados["chegada"])
        pontos = [tuple(p) for p in dados["pontos_pista"]]

        for i in range(1, len(pontos)):
            pygame.draw.line(window, Pista.WHITE, pontos[i - 1], pontos[i], 9)

        pygame.draw.circle(window, Pista.GREEN, largada, 10)
        pygame.draw.circle(window, Pista.RED, chegada, 10)
        pygame.display.flip()
        print("✅ Pista carregada de 'assets/pista.json'.")

        pygame.image.load("assets/pista.png").convert()

    def obter_largada():
        with open("assets/pista.json", "r") as f:
            dados = json.load(f)
        return tuple(dados["largada"])
    def obter_chegada():
        with open("assets/pista.json", "r") as f:
            dados = json.load(f)
        return tuple(dados["chegada"])
    

    def obter_pista():
        """Fase 1: O usuário desenha e salva a pista"""
        pygame.init()
        window = pygame.display.set_mode((Pista.WIDTH, Pista.HEIGHT))
        pygame.display.set_caption("Desenhando Pista")
        pista = Pista(window)

        window.fill(Pista.BLACK)
        pygame.display.flip()

        clock = pygame.time.Clock()
        drawing = True
        while drawing:
            drawing = pista.draw_pista_user()
            pygame.display.flip()
            clock.tick(60)

        pygame.quit()  # Fecha ao terminar o desenho


    def show_corrida():
        """Fase 2: Carrega pista e coloca carro na largada"""
        pygame.init()
        window = pygame.display.set_mode((Pista.WIDTH, Pista.HEIGHT))
        pygame.display.set_caption("Corrida")

        try:
            pista_surface = pygame.image.load("assets/pista.png").convert()
        except FileNotFoundError:
            print("❌ Arquivo 'assets/pista.png' não encontrado.")
            pygame.quit()
            return

        try:
            with open("assets/pista.json", "r") as f:
                dados = json.load(f)
                pos_largada = tuple(dados["largada"])
        except (FileNotFoundError, KeyError):
            print("❌ Erro ao carregar posição da largada.")
            pygame.quit()
            return

        carro = Carro(*pos_largada)

        clock = pygame.time.Clock()
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False

            window.blit(pista_surface, (0, 0))
            carro.update(pista_surface)
            carro.draw(window)
            pygame.display.flip()
            clock.tick(60)

        pygame.quit()