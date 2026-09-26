#include "retangulo.hpp"

#include <stdexcept>

Retangulo::Retangulo(double largura, double altura) : largura_(largura), altura_(altura) {
    if (largura <= 0 || altura <= 0) throw std::invalid_argument("lados devem ser positivos");
}

double Retangulo::area() const { return largura_ * altura_; }

double Retangulo::perimetro() const { return 2 * (largura_ + altura_); }
