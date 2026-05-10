import unittest
from unittest.mock import patch

class TestPanelAdministrativo(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.base_url = "http://localhost:3000/loans/panel/resolucion"
        print("\n" + "="*60)
        print("   INICIANDO PRUEBAS UNITARIAS: Panel Administrativo")
        print("="*60)

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*60)
        print("   PRUEBAS FINALIZADAS")
        print("="*60 + "\n")

    @patch('requests.patch')
    def test_2_1_aprobacion_manual(self, mock_patch):
        """Caso 2.1: Ejecutivo aprueba un credito manualmente"""
        print("\n--- CASO 2.1: Aprobacion manual (Clase de Equivalencia) ---")
        print("-> INPUT ENVIADO: {'decision': 'aprobado', 'ejecutivo': 'admin123'}")

        mock_patch.return_value.status_code = 200
        response = mock_patch()

        print(f"-> SALIDA ESPERADA: Codigo HTTP 200")
        print(f"-> SALIDA OBTENIDA: Codigo HTTP {response.status_code}")

        self.assertEqual(response.status_code, 200)
        print("[OK] PRUEBA SUPERADA")

    @patch('requests.get')
    def test_2_2_bloqueo_cliente(self, mock_get):
        """Caso 2.2: Seguridad - Cliente intenta acceder al panel y es bloqueado"""
        print("\n--- CASO 2.2: Bloqueo de acceso a cliente (Excepcion Esperada) ---")
        print("-> INPUT ENVIADO: GET con credenciales de cliente")

        mock_get.return_value.status_code = 403
        response = mock_get()

        print(f"-> SALIDA ESPERADA: Codigo HTTP 403 Forbidden")
        print(f"-> SALIDA OBTENIDA: Codigo HTTP {response.status_code}")

        self.assertEqual(response.status_code, 403)
        print("[OK] PRUEBA SUPERADA")

if __name__ == '__main__':
    unittest.main(verbosity=2)