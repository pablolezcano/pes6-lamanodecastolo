import hashlib
import binascii
from Crypto.Cipher import Blowfish
import sys

import os

# Config
CIPHER_KEY_HEX = os.environ.get('CIPHER_KEY', 
                  '27501fd04e6b82c831024dac5c6305221974deb9388a2190'
                  '1d576cbbe2f377ef23d75486010f37819afe6c321a0146d2'
                  '1544ec365bf7289a')
CIPHER_KEY = binascii.a2b_hex(CIPHER_KEY_HEX)

def calculate_hash(username, password, serial):
    # 1. Clean serial
    serial = serial.replace('-', '').replace(' ', '')
    # 2. Pad serial
    while len(serial) < 36:
        serial += '\0'
    
    # 3. Create string to hash
    # IMPORTANT: The username used for hashing MUST match exactly what was used during registration.
    # If the user registered as "LinceNuevo" but DB has "lincenuevo", we might have a mismatch if we use DB username.
    # However, for a reset, we define the new truth. We will use the username from DB.
    s = serial + username + '-' + password
    
    # 4. MD5
    m = hashlib.md5()
    m.update(s.encode('utf-8'))
    md5_hash = m.hexdigest()
    
    # 5. Blowfish
    cipher = Blowfish.new(CIPHER_KEY, Blowfish.MODE_ECB)
    # Pad to block size (8) if needed (MD5 hex is 32 bytes, so it's multiple of 8, no padding needed usually)
    encrypted = cipher.encrypt(binascii.a2b_hex(md5_hash))
    return binascii.b2a_hex(encrypted).decode('utf-8')

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python reset_pass.py <username> <serial> <new_password>")
        sys.exit(1)
        
    username = sys.argv[1]
    serial = sys.argv[2]
    password = sys.argv[3]
    
    new_hash = calculate_hash(username, password, serial)
    print(f"UPDATE users SET hash='{new_hash}' WHERE username='{username}';")
