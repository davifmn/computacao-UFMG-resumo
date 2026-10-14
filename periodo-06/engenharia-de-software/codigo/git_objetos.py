"""Como o Git identifica um arquivo: o hash SHA-1 de "blob <tamanho>\\0<conteúdo>".

Confere com o próprio git (se estiver instalado) e mostra que o mesmo conteúdo
tem sempre o mesmo id, em qualquer máquina.

Execute:  python3 git_objetos.py
"""
import hashlib
import shutil
import subprocess


def hash_blob(conteudo: bytes) -> str:
    cabecalho = f"blob {len(conteudo)}\0".encode()
    return hashlib.sha1(cabecalho + conteudo).hexdigest()


if __name__ == "__main__":
    exemplos = [b"", b"hello\n", "Olá, DCC!\n".encode()]
    # valores conhecidos: o blob vazio e o "hello\n" aparecem na documentação do Git
    assert hash_blob(b"") == "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
    assert hash_blob(b"hello\n") == "ce013625030ba8dba906f756967f9e9ca394464a"
    if shutil.which("git"):
        for c in exemplos:
            git = subprocess.run(["git", "hash-object", "--stdin"], input=c, capture_output=True, check=True).stdout.decode().strip()
            assert git == hash_blob(c), (c, git)
        print("hash dos blobs confere com `git hash-object`")
    for c in exemplos:
        print(f"{hash_blob(c)}  {c!r}")
    # mudar um único byte muda o id inteiro
    a, b = hash_blob(b"versao 1\n"), hash_blob(b"versao 2\n")
    print(f"'versao 1' → {a[:12]}…, 'versao 2' → {b[:12]}…")
