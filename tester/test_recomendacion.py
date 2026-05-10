import unittest
import requests

class TestRecomendacionEndpoint(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Se ejecuta una vez antes de las pruebas para preparar los datos
        cls.base_url = "http://localhost:3000/loans/recommend"
        print("\n" + "="*60)
        print("   INICIANDO PRUEBAS UNITARIAS: /loans/recommend")
        print("="*60)

    @classmethod
    def tearDownClass(cls):
        # Se ejecuta una vez al finalizar para limpiar
        print("\n" + "="*60)
        print("   PRUEBAS FINALIZADAS")
        print("="*60 + "\n")

    def test_recomendacion_exitosa(self):
        print("\n--- CASO 1.1: Cliente con perfil valido (Clase de Equivalencia) ---")
        payload = {"income": 1500000, "seniority": 3, "existing_debt": 200000}
        print(f"-> INPUT ENVIADO: {payload}")
        
        response = requests.post(self.base_url, json=payload)
        data = response.json()
        
        # Aqui imprimimos explícitamente lo que esperamos vs lo que obtenemos
        print(f"-> SALIDA ESPERADA: Codigo HTTP 200, contener 'monto' y 'score' > 50")
        print(f"-> SALIDA OBTENIDA: Codigo HTTP {response.status_code}")
        print(f"-> JSON OBTENIDO:   {data}")
        
        self.assertEqual(response.status_code, 200, "Deberia responder 200 OK")
        self.assertIn("monto", data, "La respuesta debe incluir un monto sugerido")
        self.assertGreater(data["score"], 50, "El score debe ser mayor a 50")
        print("[OK] PRUEBA SUPERADA")

    def test_recomendacion_fallida_metodo(self):
        print("\n--- CASO 1.2: Uso de metodo incorrecto (Excepcion Esperada) ---")
        print("-> INPUT ENVIADO: Peticion PUT (sin body)")
        
        # Usamos PUT para forzar el error 404 y evitar el 401 de seguridad
        response = requests.put(self.base_url)
        
        # Aqui imprimimos explícitamente lo que esperamos vs lo que obtenemos
        print(f"-> SALIDA ESPERADA: Codigo HTTP 404 (Not Found)")
        print(f"-> SALIDA OBTENIDA: Codigo HTTP {response.status_code}")
        
        # El servidor Express devuelve 404 para metodos no definidos en esa ruta
        self.assertEqual(response.status_code, 404, "Deberia dar error 404 al usar PUT")
        print("[OK] PRUEBA SUPERADA")

if __name__ == '__main__':
    unittest.main()