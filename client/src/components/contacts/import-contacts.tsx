import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportContactsProps {
  onClose: () => void;
}

export default function ImportContacts({ onClose }: ImportContactsProps) {
  const { toast } = useToast();
  const [fileFormat, setFileFormat] = useState("csv");
  const [delimiter, setDelimiter] = useState("comma");
  const [groupName, setGroupName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImportContacts = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo para importar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileFormat", fileFormat);
      formData.append("delimiter", delimiter);
      if (groupName) formData.append("groupName", groupName);

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erro ao importar contatos: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Sucesso",
        description: `${result.imported} contatos importados com sucesso!`,
      });

      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao importar contatos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileButtonClick = () => {
    document.getElementById("file-input")?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Importar Contatos</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium mb-2">Selecionar Arquivo</h3>
            <p className="text-sm text-gray-600 mb-2">
              Importe seus contatos a partir de um arquivo CSV ou Excel.{" "}
              <a href="#" className="text-blue-500 hover:text-orange-500 transition-colors">
                Baixar modelo
              </a>
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <h4 className="text-sm font-medium text-orange-800 flex items-center mb-2">
                <i className="ri-information-line mr-1.5"></i>
                Instruções para formatação do arquivo
              </h4>
              <ul className="text-xs text-orange-700 space-y-1 list-disc pl-4">
                <li>Certifique-se que seu arquivo CSV tenha as colunas: <span className="font-mono bg-orange-100 px-1 rounded">nome</span>, <span className="font-mono bg-orange-100 px-1 rounded">telefone</span> (obrigatórias) e <span className="font-mono bg-orange-100 px-1 rounded">grupo</span> (opcional)</li>
                <li>Os números de telefone devem estar no formato internacional: começando com "+" seguido do código do país (Ex: +5511999999999)</li>
                <li>Evite caracteres especiais nos nomes (acentos são permitidos)</li>
                <li>Se estiver usando vírgulas no nome, certifique-se de usar aspas duplas em volta do texto</li>
                <li>Para delimitar colunas, use vírgula (,) ou ponto e vírgula (;)</li>
                <li>Tamanho máximo do arquivo: 5MB</li>
              </ul>
              <div className="mt-2 text-xs text-orange-700">
                <strong>Exemplo de arquivo CSV:</strong>
                <pre className="bg-orange-100 p-2 rounded mt-1 overflow-x-auto">
                  nome,telefone,grupo<br/>
                  "João Silva",+5511999887766,Clientes<br/>
                  "Maria Oliveira",+5511988776655,Fornecedores<br/>
                  "Carlos Pereira",+5511977665544,Clientes
                </pre>
              </div>
            </div>

            <div
              className={`border-2 ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-300"
              } rounded-lg p-8 text-center transition-colors duration-200`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <i className="ri-file-line text-4xl text-blue-500 mb-2"></i>
                  <p className="font-medium mb-1">{file.name}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    onClick={handleFileButtonClick}
                    variant="outline"
                    size="sm"
                  >
                    Escolher outro arquivo
                  </Button>
                </div>
              ) : (
                <>
                  <i className="ri-upload-cloud-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-600 mb-4">
                    Arraste e solte seu arquivo aqui ou
                  </p>
                  <Button 
                    onClick={handleFileButtonClick}
                    className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 transition-all duration-300"
                  >
                    Selecionar Arquivo
                  </Button>
                </>
              )}
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Configurações de Importação</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="file-format" className="mb-1">
                  Formato do Arquivo
                </Label>
                <Select value={fileFormat} onValueChange={setFileFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fileFormat === "csv" && (
                <div>
                  <Label htmlFor="delimiter" className="mb-1">
                    Delimitador (para CSV)
                  </Label>
                  <Select value={delimiter} onValueChange={setDelimiter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o delimitador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comma">Vírgula (,)</SelectItem>
                      <SelectItem value="semicolon">Ponto e vírgula (;)</SelectItem>
                      <SelectItem value="tab">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="group-name" className="mb-1">
                  Nome do Grupo (opcional)
                </Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Clientes, Marketing, etc."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImportContacts}
            disabled={!file || isLoading}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 transition-all duration-300"
          >
            {isLoading ? (
              <span className="flex items-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Importando...
              </span>
            ) : (
              "Importar Contatos"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
