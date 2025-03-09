import React, { useState, useEffect } from 'react';
import './App.css';
import mqtt from 'mqtt';

function App() {
  const [status, setStatus] = useState("");

  // Dirección IP del ESP32 en modo AP
  const ipAddress = "http://192.168.4.1"; // Cambia a la IP del ESP32

  // Configuración de MQTT
  const mqttBroker = "ws://107.20.30.189:15675/ws"; // Cambia a la IP de tu servidor RabbitMQ
  const mqttUser = "admin";
  const mqttPassword = "admin";
  const topic = "carro/estado";

  useEffect(() => {
    const client = mqtt.connect(mqttBroker, {
      username: mqttUser,
      password: mqttPassword,
    });

    client.on("connect", () => {
      console.log("Conectado a MQTT");
      client.subscribe(topic);
    });

    client.on("message", (receivedTopic, message) => {
      if (receivedTopic === topic) {
        setStatus(message.toString()); // Actualiza el estado con el mensaje recibido
      }
    });

    return () => {
      client.end(); // Cierra la conexión cuando el componente se desmonta
    };
  }, []);

  // Funciones para hacer peticiones HTTP al ESP32 y enviar comandos por MQTT
  const sendCommand = async (command) => {
    try {
      const response = await fetch(`${ipAddress}/${command}`);
      const text = await response.text();
      setStatus(text); // Actualiza el estado con la respuesta del ESP32
    } catch (error) {
      console.error("Error al enviar el comando:", error);
    }
  };

  const sendMQTTCommand = (command) => {
    const client = mqtt.connect(mqttBroker, {
      username: mqttUser,
      password: mqttPassword,
    });
    client.on("connect", () => {
      client.publish("carro/control", command);
      client.end();
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Control del Carro RC</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto">
          <div className="col-span-1"></div>
          <div className="col-span-1">
            <button 
              onClick={() => { sendCommand('adelante'); sendMQTTCommand('adelante'); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-lg shadow-md active:translate-y-0.5 active:shadow-sm transition-all"
            >
              🔼
            </button>
          </div>
          <div className="col-span-1"></div>
          
          <div className="col-span-1">
            <button 
              onClick={() => { sendCommand('izquierda'); sendMQTTCommand('izquierda'); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-lg shadow-md active:translate-x-0.5 active:shadow-sm transition-all"
            >
              ◀️
            </button>
          </div>
          <div className="col-span-1">
            <button 
              onClick={() => { sendCommand('stop'); sendMQTTCommand('stop'); }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-6 rounded-lg shadow-md active:scale-95 active:shadow-sm transition-all"
            >
              ⏹️
            </button>
          </div>
          <div className="col-span-1">
            <button 
              onClick={() => { sendCommand('derecha'); sendMQTTCommand('derecha'); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-lg shadow-md active:translate-x-0.5 active:shadow-sm transition-all"
            >
              ▶️
            </button>
          </div>
          
          {/* Tercera fila - Solo botón atrás */}
          <div className="col-span-1"></div>
          <div className="col-span-1">
            <button 
              onClick={() => { sendCommand('atras'); sendMQTTCommand('atras'); }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-lg shadow-md active:translate-y-0.5 active:shadow-sm transition-all"
            >
              🔽
            </button>
          </div>
          <div className="col-span-1"></div>
        </div>

        {/* Status Panel - Mejorado */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Estado del Carro:</h3>
          <div className="bg-white p-3 rounded-lg border border-gray-200 min-h-[60px] flex items-center">
            <p className="text-gray-600 w-full">{status || "Esperando datos..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;