// Concorrência com POSIX threads: a condição de corrida no contador, a mesma
// coisa protegida por mutex e o produtor-consumidor com buffer limitado
// (mutex + variáveis de condição).
// Compile: gcc -std=c11 -Wall -Wextra -pthread concorrencia.c -o concorrencia && ./concorrencia
#include <assert.h>
#include <pthread.h>
#include <stdio.h>

#define N_THREADS 4
#define ITERACOES 1000000

// ---------- Contador ----------

static volatile long contador = 0;          // volatile: impede o compilador de juntar as somas
static pthread_mutex_t trava = PTHREAD_MUTEX_INITIALIZER;

static void *soma_sem_trava(void *arg) {
    (void)arg;
    for (int i = 0; i < ITERACOES; i++)
        contador = contador + 1;            // lê, soma, escreve: três passos interrompíveis
    return NULL;
}

static void *soma_com_trava(void *arg) {
    (void)arg;
    for (int i = 0; i < ITERACOES; i++) {
        pthread_mutex_lock(&trava);         // região crítica
        contador = contador + 1;
        pthread_mutex_unlock(&trava);
    }
    return NULL;
}

static long roda(void *(*f)(void *)) {
    pthread_t t[N_THREADS];
    contador = 0;
    for (int i = 0; i < N_THREADS; i++) pthread_create(&t[i], NULL, f, NULL);
    for (int i = 0; i < N_THREADS; i++) pthread_join(t[i], NULL);
    return contador;
}

// ---------- Produtor-consumidor ----------

#define TAM 8
#define ITENS 100000

static int buffer[TAM];
static int ini = 0, fim = 0, ocupados = 0;
static pthread_mutex_t mbuf = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t nao_cheio = PTHREAD_COND_INITIALIZER, nao_vazio = PTHREAD_COND_INITIALIZER;
static long long soma_consumida = 0;

static void *produtor(void *arg) {
    (void)arg;
    for (int i = 1; i <= ITENS; i++) {
        pthread_mutex_lock(&mbuf);
        while (ocupados == TAM)             // while, não if: acordar não garante a condição
            pthread_cond_wait(&nao_cheio, &mbuf);
        buffer[fim] = i;
        fim = (fim + 1) % TAM;
        ocupados++;
        pthread_cond_signal(&nao_vazio);
        pthread_mutex_unlock(&mbuf);
    }
    return NULL;
}

static void *consumidor(void *arg) {
    (void)arg;
    int anterior = 0;
    for (int i = 1; i <= ITENS; i++) {
        pthread_mutex_lock(&mbuf);
        while (ocupados == 0)
            pthread_cond_wait(&nao_vazio, &mbuf);
        int item = buffer[ini];
        ini = (ini + 1) % TAM;
        ocupados--;
        pthread_cond_signal(&nao_cheio);
        pthread_mutex_unlock(&mbuf);
        assert(item == anterior + 1);       // ordem FIFO preservada, nada perdido nem duplicado
        anterior = item;
        soma_consumida += item;
    }
    return NULL;
}

int main(void) {
    long esperado = (long)N_THREADS * ITERACOES;
    long sem = roda(soma_sem_trava);
    printf("sem trava: %ld (esperado %ld, perdeu %ld atualizacoes)\n", sem, esperado, esperado - sem);
    long com = roda(soma_com_trava);
    assert(com == esperado);
    printf("com mutex: %ld (correto)\n", com);

    pthread_t p, c;
    pthread_create(&p, NULL, produtor, NULL);
    pthread_create(&c, NULL, consumidor, NULL);
    pthread_join(p, NULL);
    pthread_join(c, NULL);
    assert(soma_consumida == (long long)ITENS * (ITENS + 1) / 2);
    printf("produtor-consumidor: %d itens pelo buffer de %d posicoes, soma %lld confere\n", ITENS, TAM, soma_consumida);
    return 0;
}
