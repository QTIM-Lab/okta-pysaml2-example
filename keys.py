import OpenSSL, tempfile

# ----- SCRIPT 1 -----
def pfx_to_pem(pfx_path='community-help.mgh.harvard.edu.pfx', pfx_password='v74DYzrZKfD3j924'):
    ''' Decrypts the .pfx file to be used with requests. '''
    pfx = open(pfx_path, 'rb').read()
    p12 = OpenSSL.crypto.load_pkcs12(pfx, pfx_password)
    with open('community-help.mgh.harvard.edu.pem.key', 'wb') as t_pem:
        t_pem.write(OpenSSL.crypto.dump_privatekey(OpenSSL.crypto.FILETYPE_PEM, p12.get_privatekey()))
    with open('community-help.mgh.harvard.edu.pem.crt', 'wb') as t_pem:
        t_pem.write(OpenSSL.crypto.dump_certificate(OpenSSL.crypto.FILETYPE_PEM, p12.get_certificate()))
        ca = p12.get_ca_certificates()
        if ca is not None:
            for cert in ca:
                t_pem.write(OpenSSL.crypto.dump_certificate(OpenSSL.crypto.FILETYPE_PEM, cert))

pfx_to_pem()

# # read some config
# with open('config.json') as config_json:
#     config = json.load(config_json)
#     api_url = config['api_url']
#     cert = config['cert']

#     cert_pem_path = cert['file']
#     cert_key_file = cert['pass']

# # make the request
# with pfx_to_pem(cert_pem_path, cert_key_file) as cert:
#     r = requests.get(api_url, cert = cert)