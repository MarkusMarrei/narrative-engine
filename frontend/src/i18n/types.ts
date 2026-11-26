export type SupportedLanguage =
  | 'ru'
  | 'en'
  | 'de'
  | 'fr'
  | 'es'
  | 'pt'
  | 'it'
  | 'ja'
  | 'ko';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;        // English name
  nativeName: string;  // Native language name
  flag: string;        // Flag emoji
}

export interface NodePaletteItemTranslation {
  name: string;
  desc: string;
}

export interface TranslationSchema {
  nav: {
    brandSubtitle: string;
    storyPillLabel: string;
    newStoryDefault: string;
    liveSync: string;
    offline: string;
    liveSyncTooltip: string;
    offlineTooltip: string;
    addScene: string;
    characters: string;
    variables: string;
    mcp: string;
    mcpTooltip: string;
    audit: string;
    auditTooltip: string;
    themeLightTooltip: string;
    themeDarkTooltip: string;
    saveProject: string;
    saving: string;
    exportAgent: string;
    exporting: string;
    exportSuccessTitle: string;
    exportError: string;
    languageSelect: string;
  };
  palette: {
    title: string;
    openTitle: string;
    hint: string;
    newSceneBtn: string;
    nodes: {
      background: NodePaletteItemTranslation;
      music: NodePaletteItemTranslation;
      video: NodePaletteItemTranslation;
      effect: NodePaletteItemTranslation;
      character: NodePaletteItemTranslation;
      emotion: NodePaletteItemTranslation;
      appearance: NodePaletteItemTranslation;
      dialogue: NodePaletteItemTranslation;
      choice: NodePaletteItemTranslation;
      variable: NodePaletteItemTranslation;
    };
  };
  canvas: {
    startNodeTitle: string;
    startNodeSubtitle: string;
    startNodeLeadsTo: string;
    startNodeInstruction: string;
    startNodeSourceRight: string;
    startNodeSourceBottom: string;
    sceneDefaultTitle: string;
    sceneDragTooltip: string;
    deleteSceneTooltip: string;
    deleteEdge: string;
  };
  nodes: {
    // Common handles
    handleTargetLeft: string;
    handleTargetTop: string;
    handleSourceRight: string;
    handleSourceBottom: string;
    notAttachedHint: string;
    deleteNodeTooltip: string;

    // Dialogue Node
    dialogueTitle: string;
    dialoguePlaceholder: string;
    voiceAudioFile: string;
    chooseVoice: string;
    clearVoice: string;

    // Character Node
    characterTitle: string;
    activeCharacterInScene: string;
    selectCharacter: string;

    // Emotion Node
    emotionTitle: string;
    characterEmotion: string;
    selectEmotion: string;
    emotionNoCharWarning: string;

    // Appearance Node
    appearanceTitle: string;
    costumeOrState: string;
    selectAppearance: string;
    appearanceNoCharWarning: string;

    // Background Node
    backgroundTitle: string;
    bgImageUrlOrFile: string;
    transitionEffect: string;
    chooseBgFile: string;

    // Music Node
    musicTitle: string;
    musicAudioFile: string;
    chooseMusicFile: string;
    volumeLabel: string;

    // Video Node
    videoTitle: string;
    videoFileOrRef: string;
    chooseVideoFile: string;
    videoDescOrTiming: string;

    // Effect Node
    effectTitle: string;
    sfxSound: string;
    visualOverlayOrFrame: string;
    chooseSfx: string;
    chooseOverlay: string;
    directorNotes: string;

    // Choice Node
    choiceTitle: string;
    addChoiceBtn: string;
    choicePlaceholder: string;
    deleteChoiceTooltip: string;

    // Variable Node
    variableTitle: string;
    varLabel: string;
    operatorLabel: string;
    valueLabel: string;
    actionTypeSet: string;
    actionTypeModify: string;
    actionTypeCheck: string;
  };
  charactersModal: {
    modalTitle: string;
    modalSubtitle: string;
    characterList: string;
    addCharacterBtn: string;
    newCharDefaultName: string;
    newCharDefaultRoleDesc: string;
    defaultAppearanceName: string;
    defaultAppearanceDesc: string;
    nameLabel: string;
    roleLabel: string;
    roles: {
      narrator: string;
      hero: string;
      npc: string;
    };
    colorLabel: string;
    descLabel: string;
    descPlaceholder: string;
    appearancesHeading: string;
    appearancesSubheading: string;
    appearanceNamePlaceholder: string;
    appearanceDescPlaceholder: string;
    addAppearanceBtn: string;
    spriteDefault: string;
    spriteFile: string;
    emotionsHeading: string;
    emotionsSubheading: string;
    emotionNamePlaceholder: string;
    addEmotionBtn: string;
    deleteCharacterTooltip: string;
    deleteItemTooltip: string;
    openFilePickerTooltip: string;
  };
  variablesModal: {
    modalTitle: string;
    modalSubtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    typeLabel: string;
    defaultValueLabel: string;
    descLabel: string;
    descPlaceholder: string;
    addVariableBtn: string;
    existingVariables: string;
    noVariables: string;
    types: {
      boolean: string;
      number: string;
      string: string;
    };
    deleteVariableTooltip: string;
  };
  auditModal: {
    modalTitle: string;
    maturityScoreLabel: string;
    readyForExport: string;
    hasErrorsOrDeadEnds: string;
    errorsCountLabel: string;
    warningsCountLabel: string;
    issuesFoundTitle: string;
    noIssuesFound: string;
    inspectNode: string;
  };
  draftImportModal: {
    modalTitle: string;
    modalSubtitle: string;
    titleLabel: string;
    titlePlaceholder: string;
    textLabel: string;
    textPlaceholder: string;
    importBtn: string;
    importingBtn: string;
    cancelBtn: string;
    emptyTextError: string;
    importError: string;
  };
  mcpModal: {
    modalTitle: string;
    modalBadge: string;
    modalSubtitle: string;
    liveSyncTitle: string;
    liveSyncActiveDesc: string;
    liveSyncConnectingDesc: string;
    configTitle: string;
    antigravityTab: string;
    claudeTab: string;
    copyBtn: string;
    copiedBtn: string;
    instructionsHeading: string;
    instruction1: string;
    instruction2: string;
    instruction3: string;
    instruction4: string;
  };
}
