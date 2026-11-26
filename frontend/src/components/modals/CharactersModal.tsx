import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Users,
  Smile,
  Sparkles,
  Volume2,
  User,
  Shirt,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';
import type {
  CharacterDefinition,
  CharacterRole,
  CharacterExpression,
  CharacterAppearance,
} from '@narrative-engine/shared';

interface CharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharactersModal: React.FC<CharactersModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const manifest = useStoryStore((s) => s.manifest);
  const registerCharacter = useStoryStore((s) => s.registerCharacter);
  const deleteCharacter = useStoryStore((s) => s.deleteCharacter);
  const theme = useStoryStore((s) => s.theme);

  const isDark = theme === 'dark';

  const charactersMap = manifest?.meta.characters || {};
  const characters = Object.values(charactersMap);

  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || 'hero');

  // States for adding a new expression
  const [newExprName, setNewExprName] = useState('');
  const [newExprSprite, setNewExprSprite] = useState('');

  // States for adding a new appearance
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppSprite, setNewAppSprite] = useState('');

  const handlePickFile = (onFileSelected: (filename: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelected(file.name);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  const selectedChar = charactersMap[selectedCharId] || characters[0];

  const handleCreateNewCharacter = () => {
    const id = `char_${Date.now()}`;
    const newChar: CharacterDefinition = {
      id,
      name: t.charactersModal.newCharDefaultName,
      role: 'npc',
      color: isDark ? '#facc15' : '#e11d48',
      description: t.charactersModal.newCharDefaultRoleDesc,
      expressions: [
        { id: 'neutral', name: 'neutral', sprite_asset_id: `sprite_${id}_neutral` },
      ],
      appearances: [
        { id: 'default', name: t.charactersModal.defaultAppearanceName, description: t.charactersModal.defaultAppearanceDesc },
      ],
    };
    registerCharacter(newChar);
    setSelectedCharId(id);
  };

  const handleUpdateSelected = (updatedFields: Partial<CharacterDefinition>) => {
    if (!selectedChar) return;
    registerCharacter({ ...selectedChar, ...updatedFields });
  };

  // Add expression
  const handleAddExpression = () => {
    if (!selectedChar || !newExprName.trim()) return;

    const id = `expr_${Date.now()}`;
    const newExpr: CharacterExpression = {
      id,
      name: newExprName.trim(),
      sprite_asset_id: newExprSprite.trim() || undefined,
    };

    const updatedExpressions = [...(selectedChar.expressions || []), newExpr];
    handleUpdateSelected({ expressions: updatedExpressions });

    setNewExprName('');
    setNewExprSprite('');
  };

  const handleDeleteExpression = (exprId: string) => {
    if (!selectedChar) return;
    const updated = selectedChar.expressions.filter((e) => e.id !== exprId);
    handleUpdateSelected({ expressions: updated });
  };

  // Add appearance
  const handleAddAppearance = () => {
    if (!selectedChar || !newAppName.trim()) return;

    const id = `app_${Date.now()}`;
    const newApp: CharacterAppearance = {
      id,
      name: newAppName.trim(),
      description: newAppDesc.trim() || undefined,
      sprite_asset_id: newAppSprite.trim() || undefined,
    };

    const updatedAppearances = [...(selectedChar.appearances || []), newApp];
    handleUpdateSelected({ appearances: updatedAppearances });

    setNewAppName('');
    setNewAppDesc('');
    setNewAppSprite('');
  };

  const handleDeleteAppearance = (appId: string) => {
    if (!selectedChar) return;
    const updated = (selectedChar.appearances || []).filter((a) => a.id !== appId);
    handleUpdateSelected({ appearances: updated });
  };

  const getRoleBadge = (role: CharacterRole) => {
    switch (role) {
      case 'hero':
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
              isDark
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5" /> {t.charactersModal.roles.hero}
          </span>
        );
      case 'narrator':
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
              isDark
                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Volume2 className="w-2.5 h-2.5" /> {t.charactersModal.roles.narrator}
          </span>
        );
      default:
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
              isDark
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'bg-purple-50 text-purple-600 border-purple-200'
            }`}
          >
            <User className="w-2.5 h-2.5" /> {t.charactersModal.roles.npc}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-4xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] transition-colors ${
          isDark
            ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
            <div>
              <h2 className="text-base font-bold">{t.charactersModal.modalTitle}</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t.charactersModal.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#26262b]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Characters List */}
          <div
            className={`w-72 border-r flex flex-col shrink-0 transition-colors ${
              isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div
              className={`p-3 border-b flex items-center justify-between ${
                isDark ? 'border-[#28282d]' : 'border-slate-200'
              }`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                {t.charactersModal.characterList} ({characters.length})
              </span>
              <button
                onClick={handleCreateNewCharacter}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md shrink-0 whitespace-nowrap ${
                  isDark
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                }`}
                title={t.charactersModal.addCharacterBtn}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{t.charactersModal.addCharacterBtn}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {characters.map((char) => {
                const isSelected = selectedChar?.id === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharId(char.id)}
                    className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
                      isSelected
                        ? isDark
                          ? 'bg-[#222226] border-yellow-400 shadow-md ring-2 ring-yellow-400/20'
                          : 'bg-rose-50 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                        : isDark
                        ? 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500 text-zinc-300'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: char.color || (isDark ? '#facc15' : '#e11d48') }}
                      />
                      <div className="truncate">
                        <span
                          className={`text-xs font-bold block truncate ${
                            isSelected
                              ? isDark
                                ? 'text-yellow-400'
                                : 'text-rose-600'
                              : isDark
                              ? 'text-zinc-100'
                              : 'text-slate-900'
                          }`}
                        >
                          {char.name}
                        </span>
                        <span className={`text-[10px] font-mono flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          <span className="flex items-center gap-0.5"><Smile className="w-2.5 h-2.5" />{char.expressions?.length || 0}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Shirt className="w-2.5 h-2.5" />{char.appearances?.length || 0}</span>
                        </span>
                      </div>
                    </div>

                    {getRoleBadge(char.role)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Character Editor */}
          {selectedChar ? (
            <div
              className={`flex-1 overflow-y-auto p-6 space-y-5 transition-colors ${
                isDark ? 'bg-[#18181b]' : 'bg-white'
              }`}
            >
              {/* Profile Card */}
              <div
                className={`p-4 rounded-xl border space-y-4 transition ${
                  isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedChar.color || (isDark ? '#facc15' : '#e11d48') }}
                    />
                    <h3 className="text-base font-bold">{selectedChar.name}</h3>
                  </div>

                  {selectedChar.id !== 'hero' && selectedChar.id !== 'narrator' && (
                    <button
                      onClick={() => {
                        if (confirm(`${t.charactersModal.deleteCharacterTooltip} "${selectedChar.name}"?`)) {
                          deleteCharacter(selectedChar.id);
                          setSelectedCharId(characters[0]?.id || 'hero');
                        }
                      }}
                      className={`text-xs flex items-center gap-1 transition ${
                        isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                      }`}
                      title={t.charactersModal.deleteCharacterTooltip}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t.charactersModal.deleteItemTooltip}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {t.charactersModal.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={selectedChar.name}
                      onChange={(e) => handleUpdateSelected({ name: e.target.value })}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                        isDark
                          ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {t.charactersModal.roleLabel}
                    </label>
                    <select
                      value={selectedChar.role}
                      onChange={(e) =>
                        handleUpdateSelected({ role: e.target.value as CharacterRole })
                      }
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                        isDark
                          ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                      }`}
                    >
                      <option value="hero">{t.charactersModal.roles.hero}</option>
                      <option value="npc">{t.charactersModal.roles.npc}</option>
                      <option value="narrator">{t.charactersModal.roles.narrator}</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {t.charactersModal.colorLabel}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={selectedChar.color || '#facc15'}
                        onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={selectedChar.color || '#facc15'}
                        onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                        className={`w-full text-xs px-2 py-1.5 rounded-lg border font-mono focus:outline-none transition ${
                          isDark
                            ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                            : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {t.charactersModal.descLabel}
                  </label>
                  <input
                    type="text"
                    value={selectedChar.description || ''}
                    onChange={(e) => handleUpdateSelected({ description: e.target.value })}
                    placeholder={t.charactersModal.descPlaceholder}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                      isDark
                        ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* 1. Expressions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Smile className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
                      <span>{t.charactersModal.emotionsHeading}</span>
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {t.charactersModal.emotionsSubheading}
                    </p>
                  </div>
                </div>

                {/* Expressions Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {(selectedChar.expressions || []).map((expr) => (
                    <div
                      key={expr.id}
                      className={`p-3 rounded-xl border space-y-1.5 relative group transition ${
                        isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Smile className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
                          <span className="text-xs font-bold">{expr.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteExpression(expr.id)}
                          className={`p-1 transition ${
                            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title={t.charactersModal.deleteItemTooltip}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] opacity-70 font-mono">
                        <span className="truncate flex-1">
                          {expr.sprite_asset_id ? `${t.charactersModal.spriteFile} ${expr.sprite_asset_id}` : t.charactersModal.spriteDefault}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePickFile((filename) => {
                              const updated = (selectedChar.expressions || []).map((e) =>
                                e.id === expr.id ? { ...e, sprite_asset_id: filename } : e
                              );
                              handleUpdateSelected({ expressions: updated });
                            })
                          }
                          className={`p-1 rounded transition shrink-0 ml-1 ${
                            isDark
                              ? 'hover:bg-zinc-800 text-yellow-400'
                              : 'hover:bg-slate-200 text-rose-600'
                          }`}
                          title={t.charactersModal.openFilePickerTooltip}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Expression Row */}
                <div
                  className={`p-3 rounded-xl border flex gap-2 items-center transition ${
                    isDark ? 'bg-[#121214]/60 border-[#28282d]' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <input
                    type="text"
                    value={newExprName}
                    onChange={(e) => setNewExprName(e.target.value)}
                    placeholder={t.charactersModal.emotionNamePlaceholder}
                    className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                      isDark
                        ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                    }`}
                  />
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={newExprSprite}
                      onChange={(e) => setNewExprSprite(e.target.value)}
                      placeholder={t.charactersModal.spriteFile}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-mono focus:outline-none transition ${
                        isDark
                          ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handlePickFile((filename) => setNewExprSprite(filename))}
                      className={`p-1.5 rounded-lg border transition shrink-0 ${
                        isDark
                          ? 'bg-[#18181b] border-[#2c2c32] text-yellow-400 hover:bg-[#25252b]'
                          : 'bg-white border-slate-200 text-rose-600 hover:bg-slate-100'
                      }`}
                      title={t.charactersModal.openFilePickerTooltip}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddExpression}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition shadow-sm flex items-center gap-1 whitespace-nowrap ${
                      isDark
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.charactersModal.addEmotionBtn}</span>
                  </button>
                </div>
              </div>

              {/* 2. Appearances Section */}
              <div className="space-y-3 pt-2 border-t border-dashed border-zinc-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Shirt className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
                      <span>{t.charactersModal.appearancesHeading}</span>
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {t.charactersModal.appearancesSubheading}
                    </p>
                  </div>
                </div>

                {/* Appearances Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {(selectedChar.appearances || []).map((app) => (
                    <div
                      key={app.id}
                      className={`p-3 rounded-xl border space-y-1.5 relative group transition ${
                        isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shirt className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
                          <span className="text-xs font-bold">{app.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAppearance(app.id)}
                          className={`p-1 transition ${
                            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title={t.charactersModal.deleteItemTooltip}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {app.description && (
                        <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {app.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] opacity-70 font-mono pt-1">
                        <span className="truncate flex-1">
                          {app.sprite_asset_id ? `${t.charactersModal.spriteFile} ${app.sprite_asset_id}` : t.charactersModal.spriteDefault}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePickFile((filename) => {
                              const updated = (selectedChar.appearances || []).map((a) =>
                                a.id === app.id ? { ...a, sprite_asset_id: filename } : a
                              );
                              handleUpdateSelected({ appearances: updated });
                            })
                          }
                          className={`p-1 rounded transition shrink-0 ml-1 ${
                            isDark
                              ? 'hover:bg-zinc-800 text-yellow-400'
                              : 'hover:bg-slate-200 text-rose-600'
                          }`}
                          title={t.charactersModal.openFilePickerTooltip}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Appearance Form */}
                <div
                  className={`p-3 rounded-xl border space-y-2.5 transition ${
                    isDark ? 'bg-[#121214]/60 border-[#28282d]' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  {/* Top Row: Name, File Section, and Submit Button */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder={t.charactersModal.appearanceNamePlaceholder}
                      className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                        isDark
                          ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                      }`}
                    />

                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={newAppSprite}
                        onChange={(e) => setNewAppSprite(e.target.value)}
                        placeholder={t.charactersModal.spriteFile}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-mono focus:outline-none transition ${
                          isDark
                            ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                            : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handlePickFile((filename) => setNewAppSprite(filename))}
                        className={`p-1.5 rounded-lg border transition shrink-0 ${
                          isDark
                            ? 'bg-[#18181b] border-[#2c2c32] text-yellow-400 hover:bg-[#25252b]'
                            : 'bg-white border-slate-200 text-rose-600 hover:bg-slate-100'
                        }`}
                        title={t.charactersModal.openFilePickerTooltip}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddAppearance}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition shadow-sm flex items-center gap-1 whitespace-nowrap ${
                        isDark
                          ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.charactersModal.addAppearanceBtn}</span>
                    </button>
                  </div>

                  {/* Bottom Row: Full-width Description */}
                  <input
                    type="text"
                    value={newAppDesc}
                    onChange={(e) => setNewAppDesc(e.target.value)}
                    placeholder={t.charactersModal.appearanceDescPlaceholder}
                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                      isDark
                        ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100 focus:border-yellow-400 placeholder:text-zinc-600'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs opacity-50">
              {t.charactersModal.characterList}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            {t.charactersModal.modalSubtitle}
          </span>

          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isDark
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {t.charactersModal.modalTitle}
          </button>
        </div>
      </div>
    </div>
  );
};
