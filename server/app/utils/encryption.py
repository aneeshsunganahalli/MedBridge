import base64
from cryptography.fernet import Fernet
from app.config import settings

def get_fernet() -> Fernet:
    """Get the Fernet instance for encryption/decryption using AES_SECRET_KEY."""
    # Fernet expects a 32-byte url-safe base64-encoded key.
    key = settings.AES_SECRET_KEY
    if len(key) != 44 or not key.endswith('='):
        # Fallback to a valid 32-byte base64 encoded key by padding/truncating
        key_bytes = key.encode('utf-8').ljust(32, b' ')[:32]
        key = base64.urlsafe_b64encode(key_bytes).decode('utf-8')
    return Fernet(key.encode('utf-8'))

def encrypt_data(data: bytes) -> bytes:
    """Encrypt byte data using AES (Fernet)."""
    f = get_fernet()
    return f.encrypt(data)

def decrypt_data(data: bytes) -> bytes:
    """Decrypt byte data using AES (Fernet)."""
    f = get_fernet()
    return f.decrypt(data)
