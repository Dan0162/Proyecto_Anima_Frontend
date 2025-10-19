from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from server.services.email import send_contact_email

router = APIRouter(prefix="/v1/contact", tags=["contact"])

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactResponse(BaseModel):
    message: str
    success: bool

@router.post("/send", response_model=ContactResponse, status_code=status.HTTP_200_OK)
def send_contact_message(data: ContactRequest):
    """
    Envía un mensaje de contacto al equipo de soporte
    """
    try:
        success = send_contact_email(
            name=data.name,
            email=data.email,
            subject=data.subject,
            message=data.message
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al enviar el mensaje. Por favor intenta de nuevo."
            )
        
        return ContactResponse(
            message="Mensaje enviado exitosamente. Te contactaremos pronto.",
            success=True
        )
    except Exception as e:
        print(f"❌ Error en contact endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el mensaje"
        )