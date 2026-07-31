import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@apollo/client/react';

const GET_ALL_TABLES = gql`
  query GetAllTables {
    getAllTables {
      id
      number
      capacity
      status
    }
  }
`;

const CREATE_TABLE = gql`
  mutation CreateTable($number: Int!, $capacity: Int) {
    createTable(number: $number, capacity: $capacity) {
      id
      number
      capacity
      status
    }
  }
`;

const DELETE_TABLE = gql`
  mutation DeleteTable($number: Int!) {
    deleteTable(number: $number)
  }
`;

export function AdminTables() {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const { data, loading, refetch } = useQuery(GET_ALL_TABLES);
  const [createTable] = useMutation(CREATE_TABLE);
  const [deleteTable] = useMutation(DELETE_TABLE);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableNumber) return alert('Informe o número da mesa!');

    try {
      await createTable({
        variables: {
          number: parseInt(tableNumber),
          capacity: parseInt(capacity)
        }
      });
      setTableNumber('');
      refetch();
      alert(`Mesa ${tableNumber} cadastrada com sucesso!`);
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteTable = async (number) => {
    if (!window.confirm(`Tem certeza que deseja remover a Mesa ${number}?`)) return;

    try {
      await deleteTable({ variables: { number } });
      refetch();
    } catch (err) {
      alert(`Erro ao remover: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Carregando mesas...</div>;

  const tables = data?.getAllTables || [];

  return (
    <div className="min-h-screen bg-[#131722] text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-6 border-b border-gray-800 pb-3">
        🪑 Gestão e Cadastro de Mesas
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulario de Cadastro */}
        <div className="bg-[#1f2937] p-6 rounded-xl border border-gray-700 h-fit">
          <h2 className="text-xl font-bold mb-4 text-amber-500">Nova Mesa</h2>
          <form onSubmit={handleCreateTable} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Número da Mesa
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 1, 2, 3..."
                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                Capacidade (Pessoas)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Ex: 4"
                className="w-full bg-[#111827] border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-lg transition"
            >
              + Cadastrar Mesa
            </button>
          </form>
        </div>

        {/* Lista de Mesas Cadastradas */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-300">Mesas no Salão ({tables.length})</h2>

          {tables.length === 0 ? (
            <p className="text-gray-500 italic">Nenhuma mesa cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tables.map((table) => {
                const qrUrl = `https://pizzaria-app-k4j2.onrender.com/mesa/${table.number}`;

                return (
                  <div
                    key={table.id}
                    className="bg-[#1a202c] p-4 rounded-xl border border-gray-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">Mesa {table.number}</h3>
                        <p className="text-xs text-gray-400">Capacidade: {table.capacity} lugares</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          table.status === 'LIVRE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs">
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        🔗 Abrir Link/QR
                      </a>
                      <button
                        onClick={() => handleDeleteTable(table.number)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}