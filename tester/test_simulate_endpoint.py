import unittest
import requests

class TestSimulateEndpoint(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.base_url = "http://localhost:3000/loans/simulate"
        print("\n" + "="*60)
        print("   INICIANDO PRUEBAS UNITARIAS: /loans/simulate")
        print("="*60)

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*60)
        print("   PRUEBAS FINALIZADAS")
        print("="*60 + "\n")

    def test_2_1_simulacion_exitosa(self):
        print("\n--- CASO 2.1: Datos validos (Clase de Equivalencia) ---")
        payload = {"income": 1500000, "amount": 5000000, "term": 24, "seniority": 3, "existing_debt": 200000}
        print(f"-> INPUT ENVIADO: {payload}")

        response = requests.post(self.base_url, json=payload)
        data = response.json()

        print(f"-> SALIDA ESPERADA: Codigo HTTP 200, contiene 'score' y 'probabilidad'")
        print(f"-> SALIDA OBTENIDA: Codigo HTTP {response.status_code}")
        print(f"-> JSON OBTENIDO:   {data}")

        self.assertEqual(response.status_code, 200)
        self.assertIn("score", data)
        self.assertIn("probabilidad", data)
        print("[OK] PRUEBA SUPERADA")

    def test_2_2_simulacion_valores_cero(self):
        print("\n--- CASO 2.2: Valores en cero (Valor Frontera) ---")
        payload = {"income": 0, "amount": 0, "term": 0, "seniority": 0, "existing_debt": 0}
        print(f"-> INPUT ENVIADO: {payload}")

        response = requests.post(self.base_url, json=payload)
        data = response.json()

        print(f"-> SALIDA ESPERADA: Codigo HTTP 200, score=0")
        print(f"-> SALIDA OBTENIDA: Codigo HTTP {response.status_code}")
        print(f"-> JSON OBTENIDO:   {data}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["score"], 0)
        print("[OK] PRUEBA SUPERADA")

if __name__ == '__main__':
    unittest.main(verbosity=2)
