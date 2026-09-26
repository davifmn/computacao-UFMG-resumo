#pragma once

#include "forma.hpp"

class Circulo : public Forma {
public:
    explicit Circulo(double raio);  // lança std::invalid_argument se raio <= 0

    double area() const override;
    double perimetro() const override;
    std::string nome() const override { return "círculo"; }

    double raio() const { return raio_; }

private:
    double raio_;  // invariante: raio_ > 0
};
