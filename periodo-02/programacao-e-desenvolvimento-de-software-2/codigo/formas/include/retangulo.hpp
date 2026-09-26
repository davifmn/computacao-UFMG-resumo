#pragma once

#include "forma.hpp"

class Retangulo : public Forma {
public:
    Retangulo(double largura, double altura);  // lança std::invalid_argument se <= 0

    double area() const override;
    double perimetro() const override;
    // nome() não é sobrescrito: herda Forma::nome()

    bool eh_quadrado() const { return largura_ == altura_; }

private:
    double largura_, altura_;
};
