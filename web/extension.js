import { app } from "../../../scripts/app.js";
import { $el } from "../../../scripts/ui.js";

class NotesManagerExtension {
    constructor() {
        this.notes = [];
        this.currentNoteIndex = -1;

        // Main container
        this.container = $el("div.notes-manager-container", {
            className: "p-panel p-component",
            style: {
                height: "100%",
                display: "flex",
                flexDirection: "column"
            }
        });

        // Notes panel
        this.notesPanel = $el("div.notes-panel", {
            className: "p-panel-content",
            style: {
                flex: "1 1 auto",
                overflowY: "auto",
                maxHeight: "50%",
                padding: "0.5rem"
            }
        });

        // Button to create a new note
        this.addNoteBtn = $el("button", {
            className: "p-component p-button-primary p-button-sm pi pi-plus",
            style: {
                marginBottom: "5px",
				borderRadius: "var(--p-button-border-radius)",
				background: "var(--p-button-primary-background)",
				border: "1px solid var(--p-button-primary-border-color)"
            },
            onclick: () => this.createNewNote()
        });

        // Note editor
        this.noteEditor = $el("div.note-editor", {
            style: {
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: "5px"
            }
        });

        // Note title
        this.noteTitleInput = $el("input", {
            type: "text",
            placeholder: "Note Title",
            style: {
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid var(--border-color)"
            }
        });

        // Note content
        this.noteContentArea = $el("textarea", {
            placeholder: "Note content or prompt...",
            style: {
                flex: 1,
                resize: "none",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid var(--border-color)",
                fontFamily: "monospace"
            }
        });

        // Note controls panel
        this.noteControls = $el("div.note-controls", {
            style: {
                display: "flex",
                gap: "10px",
                justifyContent: "space-between"
            }
        });

        // Action buttons
        this.saveNoteBtn = $el("button", {
            className: "p-button-success pi pi-save p-button-sm",
			style: {
				borderRadius: "var(--p-button-border-radius)",
            },
            onclick: () => this.saveCurrentNote()
        });

        this.deleteNoteBtn = $el("button", {
            className: "p-button-danger pi pi-trash p-button-sm",
			style: {
				borderRadius: "var(--p-button-border-radius)",
            },
            onclick: () => this.deleteCurrentNote()
        });

        this.applyToWorkflowBtn = $el("button", {
            className: "p-button-help p-button-sm",
			style: {
				borderRadius: "var(--p-button-border-radius)",
            },
            textContent: "To workflow",
            onclick: () => this.applyToWorkflow()
        });

        // Assemble the interface
        this.noteControls.append(this.deleteNoteBtn, this.saveNoteBtn, this.applyToWorkflowBtn);
        this.noteEditor.append(this.noteTitleInput, this.noteContentArea, this.noteControls);
        this.container.append(this.addNoteBtn, this.notesPanel, this.noteEditor);

        this.createStyles();
        // Load data on initialization
        this.loadNotesFromBackend();
    }

    // Load notes from backend
    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notes-manager-container {
                background: var(--comfy-menu-bg);
                color: var(--input-text);
                border: 1px solid var(--border-color);
                border-radius: 6px;
            }

            .notes-panel {
                background: var(--comfy-input-bg);
                border-radius: 4px;
                margin: 0.5rem;
            }

            .note-item {
                padding: 0.5rem;
                margin: 0.25rem 0;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.3s;
            }

            .note-item:hover {
                background: var(--border-color);
            }

            .p-inputtextarea {
                font-family: inherit;
                background: var(--comfy-input-bg);
                color: var(--input-text);
                border: 1px solid var(--border-color);
                padding: 0.5rem;
            }
        `;
        this.container.appendChild(style);
    };

    async loadNotesFromBackend() {
        try {
            const response = await fetch('/get_notes');
            if (!response.ok) throw new Error('Error loading notes');

            const data = await response.json();
            console.log("Received data:", data);

            // Check different possible data structures
            if (data && data.notes && Array.isArray(data.notes)) {
                this.notes = data.notes;
            } else if (data && data.notes && data.notes.notes && Array.isArray(data.notes.notes)) {
                // Handle double nesting
                this.notes = data.notes.notes;
            } else if (Array.isArray(data)) {
                this.notes = data;
            } else {
                console.error("Invalid data format:", data);
                this.notes = [];
            }

            console.log("Notes loaded:", this.notes.length);
            this.renderNotesList();

            // Select the first note if any
            if (this.notes.length > 0) {
                this.selectNote(0);
            } else {
                this.hideNoteEditor();
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
            this.renderNotesList();
            this.hideNoteEditor();
        }
    }

    // Render the notes list
    renderNotesList() {
        this.notesPanel.innerHTML = '';

        if (this.notes.length === 0) {
            const emptyMsg = $el("div", {
                textContent: "No saved notes",
                style: {
                    padding: "10px",
                    textAlign: "center",
                    color: "var(--text-color-secondary)"
                }
            });
            this.notesPanel.appendChild(emptyMsg);
            return;
        }

        this.notes.forEach((note, index) => {
            const noteItem = $el("div.note-item", {
                style: {
                    overflow: "hidden"
                },
                onclick: () => this.selectNote(index)
            });
            // Determine the text to display
            // If the title is empty, use the beginning of the note content
            const displayText = note.title?.trim() || note.content?.substring(0, 150)?.trim() || "Untitled";

            const noteTitle = $el("div.note-title", {
                style: {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1
                }
            });

            // Use span for text to apply styles based on the source
            const titleText = $el("span", {
                textContent: displayText,
                style: {
                    fontWeight: note.title?.trim() ? "normal" : "italic"
                }
            });

            noteTitle.appendChild(titleText);

            noteItem.append(noteTitle);
            this.notesPanel.appendChild(noteItem);
        });
    }

    // Select a note
    selectNote(index) {
        if (index < 0 || index >= this.notes.length) return;

        this.currentNoteIndex = index;
        const note = this.notes[index];

        this.noteTitleInput.value = note.title || "";
        this.noteContentArea.value = note.content || "";

        this.showNoteEditor();
        this.renderNotesList();
    }

    // Create a new note
    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: "",
            content: ""
        };

        this.notes.unshift(newNote);
        this.renderNotesList();
        this.selectNote(0);
    }

    // Save the current note
    async saveCurrentNote() {
        if (this.currentNoteIndex < 0) return;

        const updatedNote = {
            ...this.notes[this.currentNoteIndex],
            title: this.noteTitleInput.value,
            content: this.noteContentArea.value
        };

        this.notes[this.currentNoteIndex] = updatedNote;

        try {
            await this.saveNotesToBackend();
            this.renderNotesList();
            // Show success notification
            this.showNotification("Note saved", "success");
        } catch (error) {
            console.error("Error saving note:", error);
            this.showNotification("Save error", "error");
        }
    }

    // Delete the current note
    async deleteCurrentNote() {
        if (this.currentNoteIndex < 0) return;

        if (!confirm("Are you sure you want to delete this note?")) return;

        this.notes.splice(this.currentNoteIndex, 1);

        try {
            await this.saveNotesToBackend();

            if (this.notes.length > 0) {
                this.selectNote(0);
            } else {
                this.currentNoteIndex = -1;
                this.hideNoteEditor();
            }

            this.renderNotesList();
            this.showNotification("Note deleted", "success");
        } catch (error) {
            console.error("Error deleting note:", error);
            this.showNotification("Delete error", "error");
        }
    }

    // Apply note text to the active workflow
    applyToWorkflow() {
        if (this.currentNoteIndex < 0) return;

        const content = this.noteContentArea.value;
        if (!content) return;

        try {
            // Find the selected CLIPTextEncode node
            const selectedNode = LGraphCanvas.active_canvas.current_node;
            if (!selectedNode) {
                this.showNotification("Select a node to apply text", "warning");
                return;
            }

            // Determine the node type and apply text to the appropriate field
            if (selectedNode.type === "CLIPTextEncode") {
                // Find the text field and set the value
                const textWidget = selectedNode.widgets.find(w => w.name === "text");
                if (textWidget) {
                    textWidget.value = content;
                    // Call callback to update
                    if (textWidget.callback) textWidget.callback(content);
                    this.showNotification("Text applied to CLIPTextEncode node", "success");
                }
            } else {
                this.showNotification("Select a CLIPTextEncode node", "warning");
            }
        } catch (error) {
            console.error("Error applying text:", error);
            this.showNotification("Text application error", "error");
        }
    }

    // Save notes to backend
    async saveNotesToBackend() {
        try {
            const response = await fetch('/save_notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes: this.notes }), // Send notes in the format { notes: [...] }
            });

            if (!response.ok) {
                throw new Error('Error saving notes');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error('Failed to save notes');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            throw error; // Re-throw the error to handle it in the calling code
        }
    }

    // Hide the note editor
    hideNoteEditor() {
        this.noteEditor.style.display = "none";
    }

    // Show the note editor
    showNoteEditor() {
        this.noteEditor.style.display = "flex";
    }

    // Show a notification
    showNotification(message, type = "info") {
        // Create notification element
        const notification = $el("div.notes-manager-notification", {
            textContent: message,
            style: {
                position: "fixed",
                bottom: "20px",
                right: "20px",
                padding: "10px 15px",
                borderRadius: "4px",
                color: "white",
                zIndex: 9999,
                opacity: 0,
                transition: "opacity 0.3s ease",
                backgroundColor: type === "success" ? "#4caf50" :
                                 type === "error" ? "#f44336" :
                                 type === "warning" ? "#ff9800" : "#2196f3"
            }
        });

        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => {
            notification.style.opacity = 1;
        }, 10);

        // Automatically hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Register the extension
app.registerExtension({
    name: "comfy.NotesManager.SideBar",
    async setup() {
        const NotesManager = new NotesManagerExtension();

        app.extensionManager.registerSidebarTab({
            id: "NotesManager.sidebar",
            icon: "pi pi-file-edit",
            title: "Notes Manager",
            tooltip: "Notes Manager",
            type: "custom",
            render: (el) => {
                el.style.padding = "10px";
                el.style.height = "100%";
                el.appendChild(NotesManager.container);
            },
        });
    },
});
