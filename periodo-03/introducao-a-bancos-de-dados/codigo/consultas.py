"""Usa SQLite pelo Python: carrega o banco de exemplo e roda as respostas dos
exercícios do tutorial. Execute:  python3 consultas.py
"""
import json
import sqlite3
from pathlib import Path

AQUI = Path(__file__).resolve().parent
TUTORIAL = AQUI.parent / "tutoriais"


def conecta():
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript((TUTORIAL / "universidade.sql").read_text(encoding="utf-8"))
    return db


if __name__ == "__main__":
    db = conecta()
    assert db.execute("PRAGMA foreign_key_check").fetchall() == []   # integridade referencial

    # Parâmetros com "?" evitam SQL injection: nunca concatene texto do usuário na consulta!
    curso = "CC"
    n = db.execute("SELECT COUNT(*) FROM alunos WHERE curso = ?", (curso,)).fetchone()[0]
    print(f"{n} alunos em {curso}")

    exercicios = json.loads((TUTORIAL / "exercicios-sql.json").read_text(encoding="utf-8"))
    for ex in exercicios:
        linhas = db.execute(ex["resposta"]).fetchall()
        assert linhas, f"a resposta do exercício {ex['id']} não devolveu nada"
        print(f"{ex['id']:>4}: {len(linhas)} linha(s)")

    # Uma restrição CHECK barrando dados inválidos:
    try:
        db.execute("INSERT INTO alunos VALUES (1, 'X', 'Medicina', 2025)")
        raise AssertionError("deveria ter falhado")
    except sqlite3.IntegrityError as e:
        print("Restrição funcionando:", e)
    print("Todos os testes passaram.")
