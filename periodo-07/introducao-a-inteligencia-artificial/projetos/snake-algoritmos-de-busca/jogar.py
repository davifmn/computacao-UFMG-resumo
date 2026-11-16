"""Snake com pygame: escolha um algoritmo no menu e veja o que ele pensa antes de cada passo.

    pip install pygame
    python3 jogar.py

Antes de andar, a cobra pensa: as células expandidas pela busca (ou as simulações do
Monte Carlo) aparecem uma a uma, e o caminho só aparece quando fica definido.

Menu: ←/→ troca de família, ↑/↓ escolhe, M mapa, Enter joga.
Jogo: Espaço pausa · N um passo (ou conclui o raciocínio) · T mostra/esconde o pensamento ·
      +/− velocidade · R mesma partida (o não determinístico sorteia de novo) · S outra partida ·
      M próximo mapa · B bordas (paredes/toro) · clique: põe/tira obstáculo · Esc menu.
      Em "Você joga", setas ou WASD.
"""
from __future__ import annotations

import random

import pygame

from cobra.algoritmos import FAMILIAS
from cobra.jogo import DIRS, Jogo, oposta
from cobra.mapas import MAPAS

W, H, CEL = 18, 12, 36
PAINEL = 380
LARG, ALT = W * CEL + PAINEL, H * CEL + 70

FUNDO, CASA1, CASA2 = (14, 17, 22), (26, 31, 39), (29, 34, 43)
TEXTO, APAGADO, AZUL, AMARELO = (230, 232, 235), (154, 163, 176), (88, 196, 221), (244, 211, 94)
VERDE, VERMELHO, LARANJA, TEAL, ROXO, ROSA = (131, 193, 103), (252, 98, 85), (255, 159, 67), (92, 208, 179), (177, 137, 245), (247, 143, 179)
COR_DIR = [AZUL, LARANJA, ROXO, ROSA]
OBST = (74, 81, 96)
VELOCIDADES = [2, 4, 8, 12, 20, 35, 60, 120, 250]
RACIOCINIO = 4                                  # eventos de raciocínio por passo de velocidade (padrão: 80/s)


class Humano:
    nome = "Você joga"

    def __init__(self, rng=None):
        self.dir = 1


def quebrar(fonte, texto, largura):
    linhas, atual = [], ""
    for p in texto.split():
        teste = f"{atual} {p}".strip()
        if fonte.size(teste)[0] > largura and atual:
            linhas.append(atual)
            atual = p
        else:
            atual = teste
    return linhas + ([atual] if atual else [])


class App:
    def __init__(self, tela):
        self.tela = tela
        self.f = pygame.font.SysFont("arial", 16)
        self.fb = pygame.font.SysFont("arial", 20, bold=True)
        self.ft = pygame.font.SysFont("arial", 40, bold=True)
        self.familias = list(FAMILIAS.items())
        self.col, self.lin = 0, 4                        # começa no A*
        self.toroidal = False
        self.semente_jogo, self.semente_agente = 1, 1
        self.vel = 4
        self.mostrar = True
        self.no_menu = True
        self.mapas = list(MAPAS)
        self.i_mapa = self.mapas.index("armadilha em U")
        self.obst_editado = None                      # obstáculos desenhados com o mouse
        self.pensando, self.rev, self.segurar = False, 0.0, 0.0

    # ------------------------------------------------------------------ partida
    def opcoes(self, col):
        nome, lista = self.familias[col]
        itens = [(g, C) for g, C in lista]
        if col == 0:
            itens.append(("Jogador", Humano))
        return itens

    def comecar(self):
        self.classe = self.opcoes(self.col)[self.lin][1]
        obst, comida = MAPAS[self.mapas[self.i_mapa]](W, H)
        if self.obst_editado is not None:
            obst = self.obst_editado
        self.jogo = Jogo(W, H, 1, self.toroidal, self.semente_jogo, obstaculos=frozenset(obst), comida=comida)
        self.nos = 0
        self.rodando = False
        self.acc = 0.0
        self.no_menu = False
        self.novo_agente()

    def novo_agente(self):
        self.agente = self.classe(random.Random(self.semente_agente))
        self.humano = self.classe is Humano
        self.decidir()

    def decidir(self):
        """Nova decisão; se houve busca ou simulação, ela é revelada aos poucos antes de andar."""
        self.dec = None if self.humano or not self.jogo.vivo else self.agente.decidir(self.jogo)
        if self.dec:
            self.nos += self.dec.nos
        self.pensando = bool(self.dec and self.mostrar and self.dec.replanejou and self.total_raciocinio())
        self.rev = 0.0

    def total_raciocinio(self):
        return len(self.dec.expandidos) + len(self.dec.rollouts) if self.dec else 0

    def passo(self):
        j = self.jogo
        if not j.vivo:
            return
        j.passo(self.agente.dir if self.humano else self.dec.dir)
        self.decidir()

    # ------------------------------------------------------------------ eventos
    def tecla(self, k):
        if self.no_menu:
            if k in (pygame.K_LEFT, pygame.K_RIGHT):
                self.col = 1 - self.col
                self.lin = min(self.lin, len(self.opcoes(self.col)) - 1)
            elif k == pygame.K_UP:
                self.lin = (self.lin - 1) % len(self.opcoes(self.col))
            elif k == pygame.K_DOWN:
                self.lin = (self.lin + 1) % len(self.opcoes(self.col))
            elif k in (pygame.K_RETURN, pygame.K_SPACE):
                self.comecar()
                self.rodando = True
            elif k == pygame.K_b:
                self.toroidal = not self.toroidal
            elif k == pygame.K_m:
                self.i_mapa = (self.i_mapa + 1) % len(self.mapas)
                self.obst_editado = None
            return
        setas = {pygame.K_UP: 0, pygame.K_RIGHT: 1, pygame.K_DOWN: 2, pygame.K_LEFT: 3,
                 pygame.K_w: 0, pygame.K_d: 1, pygame.K_s: 2, pygame.K_a: 3}
        if self.humano and k in setas:
            if setas[k] != oposta(self.jogo.dir):
                self.agente.dir = setas[k]
            self.rodando = True
        elif k == pygame.K_ESCAPE:
            self.no_menu = True
        elif k == pygame.K_SPACE:
            self.rodando = not self.rodando and self.jogo.vivo
        elif k == pygame.K_n:
            self.rodando = False
            if self.pensando:
                self.pensando = False            # conclui o raciocínio
            else:
                self.passo()
        elif k == pygame.K_t:
            self.mostrar = not self.mostrar
        elif k in (pygame.K_PLUS, pygame.K_EQUALS, pygame.K_KP_PLUS):
            self.vel = min(len(VELOCIDADES) - 1, self.vel + 1)
        elif k in (pygame.K_MINUS, pygame.K_KP_MINUS):
            self.vel = max(0, self.vel - 1)
        elif k == pygame.K_r:
            if self.col == 1:
                self.semente_agente += 1
            self.comecar()
            self.rodando = True
        elif k == pygame.K_s:
            self.semente_jogo += 1
            self.semente_agente += 1
            self.comecar()
        elif k == pygame.K_b:
            self.toroidal = not self.toroidal
            self.comecar()
        elif k == pygame.K_m:
            self.i_mapa = (self.i_mapa + 1) % len(self.mapas)
            self.obst_editado = None
            self.comecar()

    def clique(self, pos):
        """Põe ou tira um obstáculo; o agente pensa de novo no mundo novo."""
        if self.no_menu or not self.jogo.vivo:
            return
        x, y = pos[0] // CEL, pos[1] // CEL
        if not (0 <= x < W and 0 <= y < H):
            return
        v, j = y * W + x, self.jogo
        if v in j.corpo or v in j.comidas:
            return
        j.obstaculos = j.obstaculos ^ {v}
        self.obst_editado = set(j.obstaculos)
        self.novo_agente()

    def atualizar(self, dt):
        if self.no_menu or not self.rodando:
            return
        if self.pensando:                               # revela o raciocínio antes de andar
            self.rev += dt * RACIOCINIO * VELOCIDADES[self.vel]
            if self.rev >= self.total_raciocinio():
                self.pensando, self.segurar = False, 0.6
            return
        if self.segurar > 0:                           # um instante para ver o caminho definido
            self.segurar -= dt
            return
        self.acc += dt
        intervalo = 1 / VELOCIDADES[self.vel]
        n = 0
        while self.acc >= intervalo and self.jogo.vivo and n < 30:
            self.passo()
            self.acc -= intervalo
            n += 1
        if self.acc > 4 * intervalo:
            self.acc = 0
        if not self.jogo.vivo:
            self.rodando = False

    # ------------------------------------------------------------------ desenho
    def centro(self, v):
        return (v % W * CEL + CEL // 2, v // W * CEL + CEL // 2)

    def linha(self, celulas, cor, larg=3):
        for a, b in zip(celulas, celulas[1:]):
            if abs(a % W - b % W) + abs(a // W - b // W) == 1:     # não liga através da borda do toro
                pygame.draw.line(self.tela, cor, self.centro(a), self.centro(b), larg)

    def celula(self, v, cor, alfa):
        s = pygame.Surface((CEL - 2, CEL - 2), pygame.SRCALPHA)
        s.fill((*cor, alfa))
        self.tela.blit(s, (v % W * CEL + 1, v // W * CEL + 1))

    def texto(self, t, pos, fonte=None, cor=TEXTO):
        self.tela.blit((fonte or self.f).render(t, True, cor), pos)

    def desenhar_menu(self):
        self.tela.fill(FUNDO)
        self.texto("SNAKE · algoritmos de busca", (40, 18), self.ft, VERDE)
        for c, (nome, _) in enumerate(self.familias):
            x = 40 + c * 470
            self.texto(nome, (x, 76), self.fb, AZUL if c == self.col else APAGADO)
            grupo = None
            y = 104
            for i, (g, C) in enumerate(self.opcoes(c)):
                if g != grupo:
                    grupo = g
                    self.texto(g.upper(), (x, y + 4), cor=APAGADO)
                    y += 24
                sel = c == self.col and i == self.lin
                self.texto(("> " if sel else "   ") + C.nome, (x + 8, y - (2 if sel else 0)), self.fb if sel else self.f, AMARELO if sel else TEXTO)
                y += 22
        self.texto(f"mapa (M): {self.mapas[self.i_mapa]}", (510, ALT - 84), cor=APAGADO)
        self.texto(f"←/→ família · ↑/↓ algoritmo · Enter joga · B bordas: {'toro' if self.toroidal else 'paredes'}",
                   (510, ALT - 60), cor=APAGADO)

    def desenhar_jogo(self):
        j, t = self.jogo, self.tela
        t.fill(FUNDO)
        for v in range(W * H):
            cor = OBST if v in j.obstaculos else CASA1 if (v % W + v // W) % 2 else CASA2
            pygame.draw.rect(t, cor, (v % W * CEL, v // W * CEL, CEL, CEL))
        d = self.dec if self.mostrar else None
        if d:
            n = max(1, len(d.expandidos))
            alfa = 110 if d.replanejou else 35
            visiveis = int(self.rev) if self.pensando else len(d.expandidos) + len(d.rollouts)
            for k, v in enumerate(d.expandidos[:visiveis]):
                c = pygame.Color(0)
                c.hsla = (200 + 80 * k / n, 55, 42, 100)
                self.celula(v, (c.r, c.g, c.b), alfa)
            if self.pensando and d.expandidos and visiveis:
                v = d.expandidos[min(visiveis, len(d.expandidos)) - 1]
                pygame.draw.rect(t, AMARELO, (v % W * CEL + 1, v // W * CEL + 1, CEL - 2, CEL - 2), 3)
            for k, (dd, cel) in enumerate(d.rollouts[:visiveis]):
                self.linha([j.cabeca, *cel], COR_DIR[dd], 3 if self.pensando and k == visiveis - 1 else 1)
            if not self.pensando:                     # só depois de pensar: fronteira, fantasma e caminho
                if d.replanejou:
                    for v in d.fronteira:
                        self.celula(v, AMARELO, 55)
                for v in d.fantasma or []:
                    pygame.draw.rect(t, TEAL, (v % W * CEL + 5, v // W * CEL + 5, CEL - 10, CEL - 10), 1)
                if d.caminho:
                    self.linha([j.cabeca, *d.caminho], VERMELHO if d.perigo else VERDE)
        for c in j.comidas:
            pygame.draw.circle(t, VERMELHO, self.centro(c), CEL // 3)
        L = len(j.corpo)
        for i in range(L - 1, -1, -1):
            v, f = j.corpo[i], i / max(1, L - 1)
            cor = ((182, 240, 154) if j.vivo or j.venceu else VERMELHO) if i == 0 else \
                  (int(131 - 60 * f), int(193 - 80 * f), int(103 - 40 * f))
            pad = 2 if i == 0 else 3 + int(f * 4)
            pygame.draw.rect(t, cor, (v % W * CEL + pad, v // W * CEL + pad, CEL - 2 * pad, CEL - 2 * pad), border_radius=8)
        # painel
        x0 = W * CEL + 16
        fam = "Você" if self.humano else self.familias[self.col][0][:-1]
        self.texto(fam.upper(), (x0, 12), cor=APAGADO)
        self.texto(self.classe.nome, (x0, 32), self.fb)
        stats = [("comidas", j.comidos), ("tamanho", L), ("passos", j.passos), ("fome", f"{j.fome}/{j.limite_fome}"),
                 ("nós", self.nos), ("velocidade", f"{VELOCIDADES[self.vel]}/s")]
        for k, (a, b) in enumerate(stats):
            self.texto(f"{a}: {b}", (x0 + (k % 2) * 180, 66 + (k // 2) * 22))
        y = 140
        if d and self.pensando:
            tot = self.total_raciocinio()
            self.texto(f"pensando… {min(int(self.rev), tot)} de {tot} ({'expansões' if d.expandidos else 'simulações'})", (x0, y), cor=AMARELO)
            y += 26
        elif d and d.replanejou and d.expandidos:
            self.texto(f"caminho definido depois de {len(d.expandidos)} expansões" if d.caminho else "sem caminho", (x0, y), cor=VERDE)
            y += 26
        if d and not self.pensando:                     # o resultado só aparece depois de pensar
            for ln in quebrar(self.f, d.texto, PAINEL - 30):
                self.texto(ln, (x0, y))
                y += 20
            y += 6
            for dd, val, rot in d.candidatos:
                self.texto(f"{DIRS[dd][3]}  {rot}", (x0, y), cor=AMARELO if dd == d.dir else APAGADO)
                y += 20
        if not j.vivo:
            msg = {"venceu": "Venceu!", "parede": "Bateu na parede", "obstaculo": "Bateu num obstáculo",
                   "corpo": "Bateu no corpo", "fome": "Morreu de fome"}[j.motivo]
            self.texto(msg, (x0, ALT - 150), self.fb, VERDE if j.venceu else VERMELHO)
        if self.col == 1 and not self.humano:
            self.texto(f"semente do agente: {self.semente_agente}", (x0, ALT - 118), cor=APAGADO)
        self.texto(f"semente da comida: {self.semente_jogo} · bordas: {'toro' if j.toroidal else 'paredes'}", (x0, ALT - 96), cor=APAGADO)
        self.texto(f"mapa: {'personalizado' if self.obst_editado is not None else self.mapas[self.i_mapa]}", (x0, ALT - 74), cor=APAGADO)
        self.texto("Espaço pausa · N passo · T pensamento · +/− velocidade", (16, H * CEL + 14), cor=APAGADO)
        self.texto("R mesma partida · S outra partida · M mapa · B bordas · clique: obstáculo · Esc menu", (16, H * CEL + 38), cor=APAGADO)

    def desenhar(self):
        self.desenhar_menu() if self.no_menu else self.desenhar_jogo()


def main():
    pygame.init()
    tela = pygame.display.set_mode((LARG, ALT))
    pygame.display.set_caption("Snake · algoritmos de busca")
    app, relogio = App(tela), pygame.time.Clock()
    while True:
        dt = relogio.tick(60) / 1000
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                pygame.quit()
                return
            if e.type == pygame.KEYDOWN:
                app.tecla(e.key)
            if e.type == pygame.MOUSEBUTTONDOWN:
                app.clique(e.pos)
        app.atualizar(dt)
        app.desenhar()
        pygame.display.flip()


if __name__ == "__main__":
    main()
