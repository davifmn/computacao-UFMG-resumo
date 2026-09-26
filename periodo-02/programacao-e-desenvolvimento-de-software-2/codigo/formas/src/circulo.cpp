#include "circulo.hpp"

#include <stdexcept>

Circulo::Circulo(double raio) : raio_(raio) {
    if (raio <= 0) throw std::invalid_argument("raio deve ser positivo");
}

double Circulo::area() const { return PI * raio_ * raio_; }

double Circulo::perimetro() const { return 2 * PI * raio_; }
