import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { 
  registrarBoleto, 
  getMisBoletos,
  getBoletosCatalogo,
  getTransparencia
} from '../controllers/boleto.controller.js';
import { verifyToken, verifyEmailVerified } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Configurar multer para subir archivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Aumentado a 10MB por archivo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes y PDF.'));
    }
  }
});

// Registrar boleto (protegido + email verificado)
router.post('/registrar',
  verifyToken,
  verifyEmailVerified,
  upload.single('comprobante'),
  [
    body('nombre').trim().isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('telefono').optional().trim(),
    body('tipo_participante').isIn(['Público General', 'Estudiante TecNM']).withMessage('Tipo de participante inválido'),
    body('sede').optional().trim(),
    body('numero_control').optional().trim(),
    // Validación más flexible para numeros_boleto
    body('numeros_boleto').custom((value) => {
      let parsed;
      try {
        parsed = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (error) {
        throw new Error('Formato inválido de números de boleto');
      }
      
      if (!Array.isArray(parsed)) {
        throw new Error('Los números de boleto deben ser un array');
      }
      
      if (parsed.length < 1 || parsed.length > 5) {
        throw new Error('Debes seleccionar entre 1 y 5 boletos');
      }
      
      return true;
    })
  ],
  registrarBoleto
);

// Obtener mis boletos (protegido)
router.get('/mis-boletos', verifyToken, getMisBoletos);

// Obtener catálogo de boletos (público)
router.get('/catalogo', getBoletosCatalogo);

// Obtener transparencia (público)
router.get('/transparencia', getTransparencia);

export default router;
