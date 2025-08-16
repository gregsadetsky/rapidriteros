from ninja import NinjaAPI
from core.models import Show
from ninja.security import django_auth
from django.conf import settings
import requests
from django.http import StreamingHttpResponse
import json

api = NinjaAPI(csrf=True)

@api.get("/shows", auth=django_auth)
def get_shows(request):
    shows = Show.objects.all().order_by('created_at')
    shows_data = []
    
    for show in shows:
        shows_data.append({
            'id': show.id,
            'show_type': show.show_type,
            'created_at': show.created_at.isoformat(),
            'disabled': show.disabled,
            'display_text': str(show)
        })
    
    return {'shows': shows_data}

@api.post("/shows/{show_id}/set_disabled", auth=django_auth)
def set_show_disabled(request, show_id: int, disabled: bool):
    try:
        show = Show.objects.get(id=show_id)
        show.disabled = disabled
        show.save()
        return {'success': True, 'disabled': show.disabled}
    except Show.DoesNotExist:
        return {'success': False, 'error': 'Show not found'}

@api.post("/shows/{show_id}/delete", auth=django_auth)
def delete_show(request, show_id: int):
    try:
        show = Show.objects.get(id=show_id)
        show.delete()
        return {'success': True}
    except Show.DoesNotExist:
        return {'success': False, 'error': 'Show not found'}

@api.post("/create-show", auth=django_auth)
def create_show(request):
    try:
        import json
        data = json.loads(request.body)
        
        show_type = data.get('show_type')
        content = data.get('content')
        
        if not show_type or not content:
            return {'success': False, 'error': 'Missing show_type or content'}
        
        if show_type not in ['text', 'p5', 'shader', 'wasm']:
            return {'success': False, 'error': 'Invalid show_type'}
        
        # Create payload with show_type as key
        payload = {show_type: content}
        
        # Create new show
        show = Show.objects.create(
            show_type=show_type,
            payload=payload
        )
        
        return {'success': True, 'show_id': show.id}
    except json.JSONDecodeError:
        return {'success': False, 'error': 'Invalid JSON'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@api.get("/shows/{show_id}", auth=django_auth)
def get_show_detail(request, show_id: int):
    try:
        show = Show.objects.get(id=show_id)
        return {
            'success': True,
            'show': {
                'id': show.id,
                'show_type': show.show_type,
                'payload': show.payload,
                'created_at': show.created_at.isoformat(),
                'disabled': show.disabled
            }
        }
    except Show.DoesNotExist:
        return {'success': False, 'error': 'Show not found'}

@api.post("/shows/{show_id}/save", auth=django_auth)
def save_show(request, show_id: int):
    try:
        show = Show.objects.get(id=show_id)
        
        # Get the new payload from request body
        import json
        payload_data = json.loads(request.body)
        
        # Update the show's payload
        show.payload = payload_data
        show.save()
        
        return {'success': True}
    except Show.DoesNotExist:
        return {'success': False, 'error': 'Show not found'}
    except json.JSONDecodeError:
        return {'success': False, 'error': 'Invalid JSON payload'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


@api.post("/preview-content", auth=django_auth)
def preview_content(request):
    try:
        data = json.loads(request.body)
        show_type = data.get('show_type')
        content = data.get('content')
        
        if not show_type or not content:
            return {'success': False, 'error': 'Missing show_type or content'}
        
        # Get the appropriate renderer host from settings
        renderer_hosts = {
            'p5': settings.RENDERER_P5_HOST,
            'text': settings.RENDERER_TEXT_HOST,
            'shader': settings.RENDERER_SHADER_HOST,
            'wasm': settings.RENDERER_WASM_HOST
        }
        
        renderer_host = renderer_hosts.get(show_type)
        if not renderer_host:
            # Debug: log what renderer hosts are available
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Available renderer hosts: {renderer_hosts}")
            logger.error(f"Settings values: P5={settings.RENDERER_P5_HOST}, TEXT={settings.RENDERER_TEXT_HOST}, SHADER={settings.RENDERER_SHADER_HOST}, WASM={settings.RENDERER_WASM_HOST}")
            return {'success': False, 'error': f'No renderer configured for {show_type}. Available: {list(renderer_hosts.keys())}, Hosts: {renderer_hosts}'}
        
        # Prepare payload for renderer
        payload = {show_type: content}
        
        # Forward to renderer microservice
        def stream_renderer_response():
            try:
                response = requests.post(
                    f"{renderer_host}/render",
                    json=payload,
                    stream=True,
                    timeout=30
                )
                response.raise_for_status()
                
                for line in response.iter_lines():
                    if line:
                        yield line.decode('utf-8') + '\n'
            except Exception as e:
                yield f"event: error\ndata: {str(e)}\n\n"
        
        # Return SSE response
        response = StreamingHttpResponse(
            stream_renderer_response(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Access-Control-Allow-Origin'] = '*'
        return response
        
    except json.JSONDecodeError:
        return {'success': False, 'error': 'Invalid JSON'}
    except Exception as e:
        return {'success': False, 'error': str(e)}