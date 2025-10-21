import { Quill } from 'react-quill';

// Register custom toolbar buttons
const registerCustomButtons = () => {
    // Chemical Formula Button
    const ChemicalFormulaButton = Quill.import('ui/icons');
    ChemicalFormulaButton['chemical-formula'] = `
        <svg viewBox="0 0 18 18" fill="currentColor">
            <text x="1" y="14" font-size="12" font-family="monospace">⚗️</text>
        </svg>
    `;

    // Math Formula Button
    ChemicalFormulaButton['math-formula'] = `
        <svg viewBox="0 0 18 18" fill="currentColor">
            <text x="1" y="14" font-size="12" font-family="monospace">𝑓</text>
        </svg>
    `;

    // Alternative icon approach using Unicode symbols
    const icons = Quill.import('ui/icons');
    icons['chemical-formula'] = '⚗️';
    icons['math-formula'] = '𝑓(𝑥)';
};

// Custom Blot for Chemistry Formulas
const ChemistryBlot = Quill.import('blots/inline');

class ChemistryFormulaBlot extends ChemistryBlot {
    static create(value) {
        const node = super.create();
        node.setAttribute('data-chemistry', value);
        node.textContent = value;
        node.style.fontFamily = 'monospace';
        node.style.color = '#2563eb';
        node.style.backgroundColor = '#f0f9ff';
        node.style.padding = '2px 4px';
        node.style.borderRadius = '3px';
        return node;
    }

    static formats(node) {
        return node.getAttribute('data-chemistry');
    }

    static value(node) {
        return node.getAttribute('data-chemistry');
    }
}

ChemistryFormulaBlot.blotName = 'chemistry';
ChemistryFormulaBlot.tagName = 'span';
ChemistryFormulaBlot.className = 'chemistry-formula';

// Register the custom blot
Quill.register(ChemistryFormulaBlot);

// Export the registration function
export { registerCustomButtons, ChemistryFormulaBlot };

// Auto-register when imported
registerCustomButtons();