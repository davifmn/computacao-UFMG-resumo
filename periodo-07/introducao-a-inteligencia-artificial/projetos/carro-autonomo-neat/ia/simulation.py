from pista.pista import Pista
from carro import Carro
import pygame
import json
import neat

import pickle

def eval_genomes(genomes, config):
    pygame.init()
    window = pygame.display.set_mode((Pista.WIDTH, Pista.HEIGHT))
    pygame.display.set_caption("Treinamento IA - Visualizando")

    try:
        with open("assets/pista.json", "r") as f:
            dados = json.load(f)
            pos_largada = tuple(dados["largada"])
            pos_chegada = tuple(dados["chegada"])
    except Exception as e:
        print("❌ Erro ao carregar pista:", e)
        return

    try:
        pista_surface = pygame.image.load("assets/pista.png").convert()
    except Exception as e:
        print("❌ Erro ao carregar imagem da pista:", e)
        return

    carros, redes, genomas_validos = [], [], []

    for genome_id, genome in genomes:
        genome.fitness = 0.0
        net = neat.nn.FeedForwardNetwork.create(genome, config)
        redes.append(net)
        carros.append(Carro(*pos_largada))
        genomas_validos.append(genome)

    clock = pygame.time.Clock()
    tempo_maximo_frames = 60 * 10  # 10 segundos

    for frame in range(tempo_maximo_frames):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

        todos_mortos = True
        for i, carro in enumerate(carros):
            if carro.alive and not carro.chegada:
                todos_mortos = False
                entrada = carro.get_data(pos_chegada)
                output = redes[i].activate(entrada)

                direcao = None
                if output[0] < 0.4:
                    direcao = "LEFT"
                elif output[0] > 0.6:
                    direcao = "RIGHT"

                acelerar = output[1] > 0.5
                carro.perform_action(direcao, acelerar)
                carro.update(pista_surface)

        # Atualização da tela
        window.blit(pista_surface, (0, 0))
        for carro in carros:
            carro.draw(window)

        pygame.display.flip()
        clock.tick(60)

        if todos_mortos:
            break

        for i, carro in enumerate(carros):
            if carro.chegada:
                genomas_validos[i].fitness += 10000
            elif not carro.alive:
                genomas_validos[i].fitness -= 1000
            else:
                progresso = carro.distance
                penalidade_parado = -0.8 if carro.speed == 0 else 0
                genomas_validos[i].fitness += progresso + penalidade_parado

    pygame.quit()



# def eval_genomes(genomes, config):
#     pygame.init()
#     pygame.display.set_mode((1, 1))  # Dummy display necessário para .convert()

#     try:
#         with open("pista.json", "r") as f:
#             dados = json.load(f)
#             pos_largada = tuple(dados["largada"])
#     except Exception as e:
#         print("❌ Erro ao carregar pista:", e)
#         return

#     try:
#         pista_surface = pygame.image.load("assets/pista.png").convert()
#     except Exception as e:
#         print("❌ Erro ao carregar imagem da pista:", e)
#         return

#     carros, redes, genomas_validos = [], [], []

#     for genome_id, genome in genomes:
#         genome.fitness = 0.0
#         net = neat.nn.FeedForwardNetwork.create(genome, config)
#         redes.append(net)
#         carros.append(Carro(*pos_largada))
#         genomas_validos.append(genome)

#     clock = pygame.time.Clock()
#     tempo_maximo_frames = 60 * 10  # 10 segundos a 60 FPS

#     for frame in range(tempo_maximo_frames):
#         todos_mortos = True
#         for i, carro in enumerate(carros):
#             if carro.alive and not carro.chegada:
#                 todos_mortos = False
#                 entrada = carro.get_data()
#                 output = redes[i].activate(entrada)

#                 direcao = None
#                 if output[0] < 0.4:
#                     direcao = "LEFT"
#                 elif output[0] > 0.6:
#                     direcao = "RIGHT"

#                 acelerar = output[1] > 0.5
#                 carro.perform_action(direcao, acelerar)
#                 carro.update(pista_surface)

#         if todos_mortos:
#             break

#         for i, carro in enumerate(carros):
#             if carro.chegada:
#                 genomas_validos[i].fitness += 10000
#             elif not carro.alive:
#                 genomas_validos[i].fitness -= 1000
#             else:
#                 progresso = carro.distance
#                 penalidade_parado = -0.5 if carro.speed == 0 else 0
#                 genomas_validos[i].fitness += progresso + penalidade_parado

#         clock.tick(60)

def train_multiple_checkpoints(config, start=19, end=49, generations_per_run=50):
    for i in range(start, end + 1):
        checkpoint_name = f'neat-checkpoint-{i}'
        print(f"\n▶️ Restaurando checkpoint {checkpoint_name} e treinando {generations_per_run} gerações...")

        try:
            p = neat.Checkpointer.restore_checkpoint(checkpoint_name)
        except FileNotFoundError:
            print(f"❌ Checkpoint {checkpoint_name} não encontrado, criando nova população.")
            p = neat.Population(config)

        p.add_reporter(neat.StdOutReporter(True))
        p.add_reporter(neat.StatisticsReporter())
        p.add_reporter(neat.Checkpointer(1))

        winner = p.run(eval_genomes, generations_per_run)

        best_filename = f"best_checkpoint_{i}.pickle"
        with open(best_filename, "wb") as f:
            pickle.dump(winner, f)
        print(f"🏆 Treinamento do checkpoint {i} finalizado! Rede salva em {best_filename}.")



def run_neat(config):
    p = neat.Checkpointer.restore_checkpoint('neat-checkpoint-19')
    #p = neat.Population(config)
    p.add_reporter(neat.StdOutReporter(True))
    p.add_reporter(neat.StatisticsReporter())
    p.add_reporter(neat.Checkpointer(1))

    winner = p.run(eval_genomes, 50)
    with open("best.pickle", "wb") as f:
        pickle.dump(winner, f)

    print("🏆 Treinamento finalizado! Melhor rede salva.")


def test_best_network(config):
    pygame.init()
    window = pygame.display.set_mode((Pista.WIDTH, Pista.HEIGHT))
    pygame.display.set_caption("Testando Melhor Rede")

    fonte = pygame.font.SysFont("arial", 30)

    try:
        pista_surface = pygame.image.load("assets/pista.png").convert()
    except FileNotFoundError:
        print("❌ Arquivo 'pista.png' não encontrado.")
        return

    try:
        with open("assets/pista.json", "r") as f:
            dados = json.load(f)
            pos_largada = tuple(dados["largada"])
    except:
        print("❌ Erro ao carregar posição da largada.")
        return

    try:
        with open("best.pickle", "rb") as f:
            best_genome = pickle.load(f)
    except FileNotFoundError:
        print("❌ Arquivo 'best.pickle' não encontrado.")
        return

    net = neat.nn.FeedForwardNetwork.create(best_genome, config)
    carro = Carro(*pos_largada)

    clock = pygame.time.Clock()
    running = True

    while running:
        window.blit(pista_surface, (0, 0))

        if carro.alive and not carro.chegada:
            inputs = carro.get_data()
            output = net.activate(inputs)

            direcao = None
            if output[0] < 0.4:
                direcao = "LEFT"
            elif output[0] > 0.6:
                direcao = "RIGHT"

            acelerar = output[1] > 0.5
            carro.perform_action(direcao, acelerar)
            carro.update(pista_surface)

        carro.draw(window)

        tempo_segundos = carro.time // 60
        texto_tempo = fonte.render(f"Tempo: {tempo_segundos}s", True, (255, 255, 255))
        window.blit(texto_tempo, (20, 20))

        if not carro.alive:
            texto_morte = fonte.render("❌ Carro colidiu!", True, (255, 0, 0))
            window.blit(texto_morte, (20, 60))
        elif carro.chegada:
            texto_sucesso = fonte.render("✅ Chegou ao final!", True, (0, 255, 0))
            window.blit(texto_sucesso, (20, 60))

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()