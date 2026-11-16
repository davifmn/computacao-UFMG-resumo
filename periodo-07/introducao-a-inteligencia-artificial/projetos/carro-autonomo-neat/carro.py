import pygame
import math

CAR_SIZE_X = 20   
CAR_SIZE_Y = 20

WIDTH = 1920
HEIGHT = 1080

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)

VALID_COLORS = [WHITE, GREEN, RED]
DEGREES = [-90, -45, 0, 45, 90]

DIRECTIONS = {    
    "UP":         (0, -1),
    "DOWN":       (0, 1),
    "LEFT":       (-1, 0),
    "RIGHT":      (1, 0),
    "UP_LEFT":    (-1, -1),
    "UP_RIGHT":   (1, -1),
    "DOWN_LEFT":  (-1, 1),
    "DOWN_RIGHT": (1, 1),
    None:         (0, 0)  # Nenhuma direção
}

ACTIONS = []

for direction in DIRECTIONS.keys():
    for accelerate in [True, False]:
        ACTIONS.append((direction, accelerate))




class Carro:
    def __init__(self, largada_x, largada_y):
        self.sprite = pygame.image.load('assets/car.png').convert_alpha()
        self.sprite = pygame.transform.scale(self.sprite, (CAR_SIZE_X, CAR_SIZE_Y))
        self.rotated_sprite = self.sprite
        
        self.pos_x = largada_x - CAR_SIZE_X // 2
        self.pos_y = largada_y - CAR_SIZE_Y // 2
        self.center = [largada_x, largada_y]

        self.angle = 0
        self.speed = 0
        self.Max_SPEED = 10
        self.speed_set = False
        self.alive = True
        self.distance = 0
        self.time = 0
        self.radars = []
        self.corners = []
        self.chegada = False

    def draw(self, window):
        window.blit(self.rotated_sprite, (self.pos_x, self.pos_y))
        self.draw_sensores(window)

    def update(self, pista):
        if not self.speed_set:
            self.speed = 0
            self.speed_set = True

        self.rotated_sprite = self.rotate_center(self.sprite, self.angle)
        self.pos_x += math.cos(math.radians(360 - self.angle)) * self.speed
        self.pos_x = max(self.pos_x, 20)
        self.pos_x = min(self.pos_x, WIDTH - 120)

        self.distance += self.speed
        self.time += 1
        
        self.pos_y += math.sin(math.radians(360 - self.angle)) * self.speed
        self.pos_y = max(self.pos_y, 20)
        self.pos_y = min(self.pos_y, WIDTH - 120)

        self.center = [int(self.pos_x) + CAR_SIZE_X / 2, int(self.pos_y) + CAR_SIZE_Y / 2]

        self.calcula_bordas()
        self.check_collision(pista)
        if self.check_chegada(pista):
            self.chegada = True

        self.radars = []
        for degree in DEGREES:
            self.check_sensores(degree, pista)

    def move(self, directions):
        if "UP" in directions:
            self.y -= self.speed
        if "DOWN" in directions:
            self.y += self.speed
        if "LEFT" in directions:
            self.x -= self.speed
        if "RIGHT" in directions:
            self.x += self.speed
        if "UP_LEFT" in directions:
            self.x -= self.speed
            self.y -= self.speed
        if "UP_RIGHT" in directions:
            self.x += self.speed
            self.y -= self.speed
        if "DOWN_LEFT" in directions:
            self.x -= self.speed
            self.y += self.speed
        if "DOWN_RIGHT" in directions:
            self.x += self.speed
            self.y += self.speed


    def update_speed(self, accelerate=True):
        if accelerate and self.speed < self.Max_SPEED:
            self.speed += 1
        elif not accelerate and self.speed > 0:
            self.speed -= 1

    def rotate_center(self, image, angle):
        rectangle = image.get_rect()
        rotated_image = pygame.transform.rotate(image, angle)
        rotated_rectangle = rectangle.copy()
        rotated_rectangle.center = rotated_image.get_rect().center
        rotated_image = rotated_image.subsurface(rotated_rectangle).copy()
        return rotated_image

    def check_sensores(self, degree, game_map):
        length = 0
        max_length = 300
        angle_rad = math.radians(360 - (self.angle + degree))

        while length < max_length:
            x = int(self.center[0] + math.cos(angle_rad) * length)
            y = int(self.center[1] + math.sin(angle_rad) * length)

            if x < 0 or x >= WIDTH or y < 0 or y >= HEIGHT:
                break

            pixel_color = game_map.get_at((x, y))[:3]
            if pixel_color not in VALID_COLORS:
                break

            length += 1

        dist = int(math.sqrt((x - self.center[0])**2 + (y - self.center[1])**2))
        self.radars.append([(x, y), dist])

    def draw_sensores(self, screen):
        for radar in self.radars:
            position = radar[0]
            pygame.draw.line(screen, (0, 0, 255), self.center, position, 1)
            pygame.draw.circle(screen, (0, 0, 255), position, 5)

    def calcula_bordas(self):
        length = 0.5 * CAR_SIZE_X
        angles = [30, 150, 210, 330]
        self.corners = [
            [
                self.center[0] + math.cos(math.radians(360 - (self.angle + a))) * length,
                self.center[1] + math.sin(math.radians(360 - (self.angle + a))) * length
            ]
            for a in angles
        ]

    def check_collision(self, pista):
        self.alive = True
        for point in self.corners:
            x, y = int(point[0]), int(point[1])
            if x < 0 or x >= WIDTH or y < 0 or y >= HEIGHT:
                self.alive = False
                break
            if pista.get_at((x, y))[:3] == BLACK:
                self.alive = False
                break

    def check_chegada(self, pista):
        for point in self.corners:
            x, y = int(point[0]), int(point[1])
            if pista.get_at((x, y))[:3] == RED:
                return True
        return False


    def distancia_para_chegada(self, chegada_pos):
        dx = self.center[0] - chegada_pos[0]
        dy = self.center[1] - chegada_pos[1]
        return math.sqrt(dx**2 + dy**2)
    
    def get_data(self, chegada_pos):
        radars = self.radars
        return_values = [0, 0, 0, 0, 0]

        for i, radar in enumerate(radars):
            return_values[i] = radar[1] / 30  # distância normalizada entre 0 e 1

        return_values.append(self.speed / self.Max_SPEED)
        return_values.append(self.angle / 360.0)

        distancia = self.distancia_para_chegada(chegada_pos)
        return_values.append(distancia / 1000.0)  # opcional: normaliza para valores mais baixos

        return return_values


    def handle_input(self, teclas):
        direction = None
        # up = teclas[pygame.K_w]
        # down = teclas[pygame.K_s]
        left = teclas[pygame.K_a]
        right = teclas[pygame.K_d]

        # if up and right:
        #     direction = "UP_RIGHT"
        # elif up and left:
        #     direction = "UP_LEFT"
        # elif down and right:
        #     direction = "DOWN_RIGHT"
        # elif down and left:
        #     direction = "DOWN_LEFT"
        # elif up:
        #     direction = "UP"
        # elif down:
        #     direction = "DOWN"
        if left:
            direction = "LEFT"
        elif right:
            direction = "RIGHT"

        accelerate = teclas[pygame.K_SPACE]

        self.perform_action(direction, accelerate)

    def perform_action(self, direction, accelerate):
        # Atualiza velocidade com base na tecla espaço
        self.update_speed(accelerate)

        # Gira o carro com base na direção
        if direction == "LEFT":
            self.angle += 5
        elif direction == "RIGHT":
            self.angle -= 5
