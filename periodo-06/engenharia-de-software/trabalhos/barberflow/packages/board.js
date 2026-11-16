

export class Board {
    constructor() {
        // Horários disponíveis por dia
        this.hours = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
        this.days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Inicializa a matriz de disponibilidade: { day: { time: 'free' | 'occupied' } }
        this.schedule = {};
        this.days.forEach(day => {
            this.schedule[day] = {};
            this.hours.forEach(hour => {
                // Simulação: Algum horário aleatório fica ocupado para exemplo
                const isOccupied = Math.random() > 0.7; 
                this.schedule[day][hour] = isOccupied ? 'occupied' : 'free';
            });
        });
    }
}