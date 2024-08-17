# Descrição
Aplicação projetada para lidar com a criação de pastas no Google Drive e gerenciar a autenticação OAuth2.

## Funcionalidades Principais
### 1. Criação de Pastas no Google Drive: 
Garante que as pastas sejam criadas corretamente no Google Drive, respeitando as permissões e escopos restritos.
### 2. Autenticação OAuth2: 
Gerencia o processo completo de autenticação com as APIs do Google, gerando e concedendo tokens para outras aplicações.

### 3. Compartilhamento de Credenciais:
> [!TIP]
> Facilita a **lateralização de credenciais** para permitir que outras aplicações acessem e utilizem os recursos do Google Drive.
> Este módulo gerencia a **recepção e o compartilhamento de credenciais de autenticação**, permitindo que outra aplicação utilize
> essas credenciais para **`acessar APIs ou recursos do Google Drive`**.

![image](https://github.com/user-attachments/assets/891069fd-9214-42f8-a969-b03eabceed49)

##
> [!WARNING]
> Devido às limitações impostas pelos escopos confidenciais do Google Drive, a aplicação foi ajustada para incluir um módulo dedicado à **`criação de pastas`**.
> Com essas restrições, a aplicação agora pode criar e gerenciar pastas no Google Drive,
> uma vez que **somente arquivos dentro dessas pastas podem ser gerenciados ou criados pela aplicação**.
