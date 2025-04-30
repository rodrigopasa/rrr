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
            <p className="text-sm text-gray-600 mb-4">
              Importe seus contatos a partir de um arquivo CSV ou Excel.{" "}
              <a href="#" className="text-[#4f46e5]">
                Baixar modelo
              </a>
            </p>

            <div
              className={`border-2 ${
                isDragging ? "border-[#4f46e5]" : "border-dashed border-gray-300"
              } rounded-lg p-8 text-center`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <i className="ri-file-line text-4xl text-[#4f46e5] mb-2"></i>
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
                    className="bg-[#4f46e5] hover:bg-[#4f46e5]/90"
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
            className="bg-[#4f46e5] hover:bg-[#4f46e5]/90"
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
