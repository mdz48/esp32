import React, { useState, useEffect } from 'react';
import './App.css';
import mqtt from 'mqtt';

function App() {
  const [status, setStatus] = useState("");
  const [lastCommandTime, setLastCommandTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [mqttClient, setMqttClient] = useState(null); // Añadir este estado
  const cooldownTime = 5; // Reducido a 5 segundos entre comandos

  // Dirección IP del ESP32 en modo AP
  const ipAddress = "http://192.168.4.1"; // Cambia a la IP del ESP32

  // Configuración de MQTT
  const mqttBroker = "ws://107.20.30.189:15675/ws"; // Cambia a la IP de tu servidor RabbitMQ
  const mqttUser = "admin";
  const mqttPassword = "admin";
  const topic = "carro/estado";

  // Efecto para la conexión MQTT
  useEffect(() => {
    const client = mqtt.connect(mqttBroker, {
      username: mqttUser,
      password: mqttPassword,
    });
    
    client.on("connect", () => {
      console.log("Conectado al broker MQTT");
      client.subscribe(topic);
    });
    
    client.on("message", (receivedTopic, message) => {
      if (receivedTopic === topic) {
        setStatus(message.toString());
      }
    });
    
    // Guardar el cliente MQTT en el estado
    setMqttClient(client);
    
    return () => {
      if (client) client.end();
    };
  }, []);

  // Efecto para actualizar el tiempo de espera
  useEffect(() => {
    if (cooldown <= 0) return;
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, lastCommandTime + (cooldownTime * 1000) - Date.now());
      setCooldown(Math.ceil(remaining / 1000));
    }, 100);
    
    return () => clearInterval(timer);
  }, [lastCommandTime, cooldown]);

  // Función para verificar si se puede enviar un comando
  const canSendCommand = () => {
    return Date.now() - lastCommandTime >= cooldownTime * 1000;
  };

  // Funciones para hacer peticiones HTTP al ESP32 y enviar comandos por MQTT
  const sendCommand = async (command) => {
    if (!canSendCommand()) {
      setStatus(`Espera ${cooldown} segundos antes de enviar otro comando`);
      return;
    }

    try {
      setLastCommandTime(Date.now());
      setCooldown(cooldownTime);
      const response = await fetch(`${ipAddress}/${command}`);
      const text = await response.text();
      setStatus(text); // Actualiza el estado con la respuesta del ESP32
    } catch (error) {
      console.error("Error al enviar el comando:", error);
    }
  };

  // Función para enviar comandos MQTT usando el cliente persistente
  const sendMQTTCommand = (command) => {
    if (!canSendCommand()) {
      return; // No enviamos el comando MQTT si estamos en cooldown
    }
    
    if (mqttClient && mqttClient.connected) {
      setLastCommandTime(Date.now());
      setCooldown(cooldownTime);
      mqttClient.publish("carro/control", command);
      setStatus(`Comando enviado: ${command}`);
    } else {
      setStatus("Error: No hay conexión MQTT");
    }
  };

  // Función combinada para enviar comandos
  const handleCommand = (command) => {
    if (canSendCommand()) {
      // sendCommand(command);
      sendMQTTCommand(command);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Control del Carro RC</h1>
        
        {/* Indicador de cooldown */}
        {cooldown > 0 && (
          <div className="mb-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-center">
            Siguiente comando disponible en: <span className="font-bold">{cooldown}s</span>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto">
          <div className="col-span-1"></div>
          <div className="col-span-1">
            <button 
              onClick={() => handleCommand('adelante')}
              disabled={!canSendCommand()}
              className={`w-full text-white font-bold py-6 px-6 rounded-lg shadow-md transition-all ${
                canSendCommand() 
                  ? "bg-blue-500 hover:bg-blue-600 active:translate-y-0.5 active:shadow-sm" 
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              🔼
            </button>
          </div>
          <div className="col-span-1"></div>
          
          <div className="col-span-1">
            <button 
              onClick={() => handleCommand('izquierda')}
              disabled={!canSendCommand()}
              className={`w-full text-white font-bold py-6 px-6 rounded-lg shadow-md transition-all ${
                canSendCommand() 
                  ? "bg-blue-500 hover:bg-blue-600 active:translate-x-0.5 active:shadow-sm" 
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              ◀️
            </button>
          </div>
          <div className="col-span-1">
            <button 
              onClick={() => handleCommand('stop')}
              disabled={!canSendCommand()}
              className={`w-full text-white font-bold py-6 px-6 rounded-lg shadow-md transition-all ${
                canSendCommand() 
                  ? "bg-red-500 hover:bg-red-600 active:scale-95 active:shadow-sm" 
                  : "bg-red-300 cursor-not-allowed"
              }`}
            >
              ⏹️
            </button>
          </div>
          <div className="col-span-1">
            <button 
              onClick={() => handleCommand('derecha')}
              disabled={!canSendCommand()}
              className={`w-full text-white font-bold py-6 px-6 rounded-lg shadow-md transition-all ${
                canSendCommand() 
                  ? "bg-blue-500 hover:bg-blue-600 active:translate-x-0.5 active:shadow-sm" 
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              ▶️
            </button>
          </div>
          
          <div className="col-span-1"></div>
          <div className="col-span-1">
            <button 
              onClick={() => handleCommand('atras')}
              disabled={!canSendCommand()}
              className={`w-full text-white font-bold py-6 px-6 rounded-lg shadow-md transition-all ${
                canSendCommand() 
                  ? "bg-blue-500 hover:bg-blue-600 active:translate-y-0.5 active:shadow-sm" 
                  : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              🔽
            </button>
          </div>
          <div className="col-span-1"></div>
        </div>

        {/* Status Panel */}
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