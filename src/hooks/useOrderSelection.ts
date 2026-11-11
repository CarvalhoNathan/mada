import { useState, useCallback } from 'react';
import { OrdemServico, PieceLot, RecipeState } from '../types';
import { MOCK_ORDENS_SERVICO } from '../data';

const INITIAL_PIECE_LOT: PieceLot = MOCK_ORDENS_SERVICO[0].pecaLote;

interface UseOrderSelectionParams {
  setRecipe: React.Dispatch<React.SetStateAction<RecipeState>>;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export function useOrderSelection({ setRecipe, showToast }: UseOrderSelectionParams) {
  const [selectedOSNumber, setSelectedOSNumber] = useState(MOCK_ORDENS_SERVICO[0].numero);
  const [clientName, setClientName] = useState(MOCK_ORDENS_SERVICO[0].clienteNome);
  const [projectName, setProjectName] = useState(MOCK_ORDENS_SERVICO[0].projetoNome);
  const [selectedEnvironment, setSelectedEnvironment] = useState(MOCK_ORDENS_SERVICO[0].ambienteNome);
  const [pieceLot, setPieceLot] = useState<PieceLot>(INITIAL_PIECE_LOT);

  const handleSelectPieceLot = useCallback(
    (lote: PieceLot, envName?: string) => {
      if (envName) {
        setSelectedEnvironment(envName);
      }
      setPieceLot(lote);
      const parsedVol = parseInt(
        (lote.volumeEstimado || lote.estVolume || '').replace(/\D/g, ''),
        10
      );
      if (parsedVol >= 100 && parsedVol <= 5000) {
        setRecipe((prev) => ({ ...prev, totalVolume: parsedVol }));
      }
      const labelEnv = envName || selectedEnvironment;
      showToast(
        `✓ ${labelEnv}: ${lote.titulo || lote.title} selecionado • Volume previsto: ${lote.volumeEstimado || lote.estVolume}`,
        'info'
      );
    },
    [selectedEnvironment, setRecipe, showToast]
  );

  const handleSelectOS = useCallback(
    (os: OrdemServico) => {
      const primeiroAmbiente = os.ambientesObra?.[0];
      const envInicial = primeiroAmbiente?.nome || os.ambienteNome;
      const loteInicial = primeiroAmbiente?.lotesPecas?.[0] || os.pecaLote;

      setSelectedOSNumber(os.numero);
      setClientName(os.clienteNome);
      setProjectName(os.projetoNome);
      setSelectedEnvironment(envInicial);
      setPieceLot(loteInicial);
      const parsedVol = parseInt((loteInicial.volumeEstimado || '').replace(/\D/g, ''), 10);
      if (parsedVol >= 100 && parsedVol <= 5000) {
        setRecipe((prev) => ({ ...prev, totalVolume: parsedVol }));
      }
      showToast(
        `✓ ${os.numero} (${envInicial}) vinculada • Meta ajustada para ${loteInicial.volumeEstimado}!`,
        'success'
      );
    },
    [setRecipe, showToast]
  );

  return {
    selectedOSNumber,
    clientName,
    projectName,
    selectedEnvironment,
    pieceLot,
    setSelectedOSNumber,
    setClientName,
    setProjectName,
    setSelectedEnvironment,
    setPieceLot,
    handleSelectPieceLot,
    handleSelectOS,
  };
}
