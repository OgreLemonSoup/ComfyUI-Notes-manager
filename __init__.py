import os
import json
import folder_paths
from server import PromptServer
from aiohttp import web

EXTENSION_FOLDER = os.path.join(os.path.dirname(os.path.realpath(__file__)))

NOTES_FILE = os.path.join(EXTENSION_FOLDER, "notes.json")

class NotesManagerExtension:
    def __init__(self):
        self.server = PromptServer.instance

        @self.server.routes.get("/get_notes")
        async def get_notes(request):
            try:
                if not os.path.exists(NOTES_FILE):
                    return web.json_response({"notes": []})

                with open(NOTES_FILE, "r", encoding="utf-8") as f:
                    notes = json.load(f)
                    return web.json_response({"notes": notes})
            except Exception as e:
                print(f"Error loading notes: {e}")
                return web.json_response({"error": str(e)}, status=500)

        @self.server.routes.post("/save_notes")
        async def save_notes(request):
            try:
                json_data = await request.json()

                os.makedirs(EXTENSION_FOLDER, exist_ok=True)

                with open(NOTES_FILE, "w", encoding="utf-8") as f:
                    json.dump(json_data, f, ensure_ascii=False, indent=2)

                return web.json_response({"success": True})
            except Exception as e:
                print(f"Error saving notes: {e}")
                return web.json_response({"error": str(e)}, status=500)

notes_manager_extension = NotesManagerExtension()

def setup():
    print("Notes Manager Extension initialized")

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
WEB_DIRECTORY = "./web"
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'setup', 'WEB_DIRECTORY']
