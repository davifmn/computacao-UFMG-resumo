#include "forma.hpp"

#include <sstream>

std::string Forma::descricao() const {
    std::ostringstream out;
    out << nome() << " (área " << area() << ", perímetro " << perimetro() << ")";
    return out.str();
}
