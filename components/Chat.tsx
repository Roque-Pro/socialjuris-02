import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Video, Phone, X, Mic, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { Message, User, Case } from '../types';
import { useApp } from '../store';
import { supabase } from '../services/supabaseClient';

interface ChatProps {
  currentCase: Case;
  currentUser: User;
  otherPartyName: string;
  otherParty?: User;
  onClose?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ currentCase, currentUser, otherPartyName, otherParty, onClose }) => {
  const { sendMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>(currentCase.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime subscription para mensagens
  useEffect(() => {
    setLiveMessages(currentCase.messages);
    
    const channel = supabase
      .channel(`case:${currentCase.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `case_id=eq.${currentCase.id}` },
        (payload: any) => {
          const newMsg = {
            id: payload.new.id,
            caseId: payload.new.case_id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            type: payload.new.type || 'text',
            fileUrl: payload.new.file_url,
            timestamp: payload.new.timestamp,
          };
          setLiveMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCase.id]);

  const activeMessages = liveMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = async () => {
     if (!inputText.trim()) return;
     
     const newMsg: Message = {
       id: `temp-${Date.now()}`,
       caseId: currentCase.id,
       senderId: currentUser.id,
       content: inputText,
       type: 'text',
       fileUrl: null,
       timestamp: new Date().toISOString(),
     };
     
     // Adicionar mensagem localmente imediatamente
     setLiveMessages(prev => [...prev, newMsg]);
     setInputText('');
     
     // Enviar ao servidor
     await sendMessage(currentCase.id, inputText);
     
     // Simulate typing response if it's a new interaction
     if (activeMessages.length < 5) {
         setIsTyping(true);
         setTimeout(() => {
             setIsTyping(false);
         }, 2500);
     }
   };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       const type = file.type.startsWith('image/') ? 'image' : 'file';
       
       const newMsg: Message = {
         id: `temp-${Date.now()}`,
         caseId: currentCase.id,
         senderId: currentUser.id,
         content: `Enviou um arquivo: ${file.name}`,
         type: type as 'image' | 'file',
         fileUrl: type === 'image' ? 'https://picsum.photos/400/300' : null,
         timestamp: new Date().toISOString(),
       };
       
       setLiveMessages(prev => [...prev, newMsg]);
       await sendMessage(currentCase.id, `Enviou um arquivo: ${file.name}`, type);
     }
   };

  const VideoModal = () => (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col animate-in fade-in duration-300">
      <div className="relative flex-1 bg-slate-800 flex items-center justify-center overflow-hidden">
        {/* Remote Video Placeholder */}
        <img src={`https://picsum.photos/seed/${currentCase.lawyerId || 'remote'}/800/600`} alt="Remote" className="absolute w-full h-full object-cover opacity-60" />
        <div className="absolute top-4 right-4 w-32 h-48 bg-slate-900 rounded-lg border-2 border-slate-700 overflow-hidden shadow-2xl">
           {/* Self Video Placeholder (would be webcam) */}
           <div className="w-full h-full bg-slate-950 flex items-center justify-center">
             <span className="text-xs text-slate-500">Sua Câmera</span>
           </div>
        </div>
        <div className="z-10 text-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
             <span className="text-3xl">👤</span>
          </div>
          <h3 className="text-white text-xl font-semibold">{otherPartyName}</h3>
          <p className="text-slate-400">Conectando...</p>
        </div>
      </div>
      <div className="h-20 bg-slate-900 flex items-center justify-center space-x-6">
        <button className="p-4 bg-slate-700 rounded-full text-white hover:bg-slate-600 transition"><Mic className="w-6 h-6" /></button>
        <button className="p-4 bg-red-600 rounded-full text-white hover:bg-red-700 transition transform hover:scale-110 shadow-lg shadow-red-600/50" onClick={() => setIsVideoOpen(false)}><Phone className="w-6 h-6 rotate-135" /></button>
        <button className="p-4 bg-slate-700 rounded-full text-white hover:bg-slate-600 transition"><Video className="w-6 h-6" /></button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[600px] w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative">
      {isVideoOpen && <VideoModal />}
      
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {otherPartyName.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-semibold text-slate-900">{otherPartyName}</h3>
              {otherParty?.verified && otherParty.role === 'LAWYER' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center ml-2 bg-green-100 text-green-700">
                  <Check className="w-3 h-3 mr-1" />
                  Verificado
                </span>
              )}
            </div>
            <p className="text-xs text-green-600 flex items-center font-medium">Online agora</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsVideoOpen(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
            title="Iniciar videochamada"
          >
            <Video className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" id="messages-container">
        {activeMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isSystem = msg.type === 'system';
          
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">{msg.content}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}>
                {msg.type === 'image' && (
                  <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                     <img src={msg.fileUrl || "https://picsum.photos/300/200"} alt="attachment" className="w-full h-auto object-cover" />
                  </div>
                )}
                {msg.type === 'file' && (
                  <div className="flex items-center space-x-2 bg-black/10 p-2 rounded mb-1">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm underline italic">Documento Anexado</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className={`text-[10px] mt-1 flex items-center justify-end space-x-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
             <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex space-x-1">
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition shadow-md shadow-indigo-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};