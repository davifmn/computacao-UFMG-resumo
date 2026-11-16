from pista.pista import Pista
from carro import Carro
import pygame
import json
import neat
import os
import ia.simulation

def play():
    pygame.init()
    window = pygame.display.set_mode((Pista.WIDTH, Pista.HEIGHT))
    pygame.display.set_caption("Corrida")

    fonte = pygame.font.SysFont("arial", 30)

    try:
        pista_surface = pygame.image.load("assets/pista.png").convert()
    except FileNotFoundError:
        print("❌ Arquivo 'pista.png' não encontrado.")
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

        teclas = pygame.key.get_pressed()
        carro.handle_input(teclas)
        carro.update(pista_surface)

        window.blit(pista_surface, (0, 0))
        carro.draw(window)

        tempo_segundos = carro.time // 60
        texto_tempo = fonte.render(f"Tempo: {tempo_segundos}s", True, (255, 255, 255))
        window.blit(texto_tempo, (20, 20))

        pygame.display.flip()
        clock.tick(60)

        if not carro.alive:
            print(f"❌ Carro colidiu! Tempo: {tempo_segundos}s")
            running = False
        elif carro.chegada:
            print(f"✅ Carro chegou! Tempo: {tempo_segundos}s")
            running = False

    pygame.quit()




def main():
    local_dir = os.path.dirname(__file__)
    config_path = os.path.join(local_dir, "ia/config.txt")
    config = neat.Config(
        neat.DefaultGenome,
        neat.DefaultReproduction,
        neat.DefaultSpeciesSet,
        neat.DefaultStagnation,
        config_path,
    )

    print("Escolha uma opção:")
    print("[0] Desenhar nova pista")
    print("[1] Jogar manualmente")
    print("[2] Treinar IA")
    print("[3] Testar melhor rede")
    escolha = input("Digite 1, 2 ou 3: ")

    if escolha == "0":
        Pista.obter_pista()

    elif escolha == "1":
        play()

    elif escolha == "2":  # escolha no numero de treinamentos
        ia.simulation.train_multiple_checkpoints(config, start=0, end=40, generations_per_run=50)
            
    elif escolha == "3":
         ia.simulation.test_best_network(config)

    else:
        print("❌ Opção inválida.")


if __name__ == "__main__":
    main()
