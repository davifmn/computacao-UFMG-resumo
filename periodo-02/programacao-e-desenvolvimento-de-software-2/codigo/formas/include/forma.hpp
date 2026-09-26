#pragma once

#include <string>

// M_PI não faz parte do C++ padrão; definimos a nossa constante.
inline constexpr double PI = 3.14159265358979323846;

// Classe base abstrata: define a interface comum a todas as formas.
class Forma {
public:
    virtual ~Forma() = default;  // destrutor virtual: delete via Forma* é seguro

    virtual double area() const = 0;       // virtual pura
    virtual double perimetro() const = 0;  // virtual pura
    virtual std::string nome() const { return "forma"; }

    // Não virtual: usa as virtuais acima (padrão "template method").
    std::string descricao() const;
};
