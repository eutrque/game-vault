import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../styles/Privacy.css';

const Privacy = () => {
    return (
        <div className="gv-privacy-section py-5">
            <Container>
                <div className="text-center mb-5 mt-4">
                    <h1 className="gv-privacy-main-title">POLÍTICA DE <span className="text-purple">PRIVACIDAD</span></h1>
                    <p className="gv-privacy-update">Última actualización: Abril 2026</p>
                </div>

                <Row className="justify-content-center">
                    <Col lg={9}>
                        <div className="gv-privacy-content">
                            
                            {/* Sección 1: Datos recopilados */}
                            <div className="gv-privacy-item">
                                <div className="gv-privacy-icon"><i className="bi bi-database-check"></i></div>
                                <div className="gv-privacy-text">
                                    <h4>1. Información que recopilamos</h4>
                                    <p>En GameVault estamos fuertemente comprometidos con la transparencia respecto a la información que gestionamos. Cuando interactúas con nuestra plataforma, recopilamos información fundamental para establecer tu identidad digital, limitándonos a tu dirección de correo electrónico, tu nombre de usuario, tu apodo público (nickname), la biografía de tu perfil y tu avatar. Adicionalmente, a medida que utilizas el servicio, el sistema almacena de forma estructurada los datos relativos a tu actividad. Esto abarca los títulos que decides registrar en tu biblioteca personal, el cómputo de horas de juego, los diferentes estados de progreso asignados a cada título y el contenido exacto de las calificaciones o reseñas que decides hacer públicas para el resto de la comunidad.</p>
                                </div>
                            </div>

                            {/* Sección 2: Uso de los datos */}
                            <div className="gv-privacy-item">
                                <div className="gv-privacy-icon"><i className="bi bi-cpu"></i></div>
                                <div className="gv-privacy-text">
                                    <h4>2. Finalidad, tratamiento y no comercialización</h4>
                                    <p>Toda la información recopilada tiene como propósito exclusivo estructurar, mantener y mejorar tu experiencia como usuario dentro de nuestro ecosistema. El procesamiento de estos datos en nuestros servidores nos permite generar tus estadísticas globales agregadas, ofreciéndote un panel de control preciso sobre tu recorrido como jugador. Tu dirección de correo electrónico representa una pieza crítica de nuestra infraestructura y se utiliza estrictamente para comunicaciones de servicio y para el proceso de activación de cuenta. GameVault garantiza formalmente que en ningún caso comercializamos, alquilamos ni cedemos tu información personal o hábitos de juego a empresas de terceros, agencias de publicidad o plataformas de análisis de datos externas.</p>
                                </div>
                            </div>

                            {/* Sección 3: Seguridad y Autenticación (CORREGIDA) */}
                            <div className="gv-privacy-item">
                                <div className="bi bi-shield-check gv-privacy-icon"></div>
                                <div className="gv-privacy-text">
                                    <h4>3. Seguridad de acceso y verificación de identidad</h4>
                                    <p>Proteger la integridad de tu biblioteca de juegos y la confidencialidad de tu perfil es nuestra máxima prioridad técnica. El acceso a la plataforma se realiza mediante credenciales personales protegidas por algoritmos de encriptación. Como medida de seguridad adicional y para garantizar la autenticidad de nuestra comunidad, cada nueva cuenta requiere un proceso de activación obligatoria mediante un enlace único enviado por correo electrónico. Dicho enlace de verificación cuenta con un tiempo de vida (TTL) estrictamente limitado a 300 segundos. Una vez validada tu identidad, tus sesiones quedan blindadas mediante el uso de Tokens de Sesión (JWT) encriptados. Además, toda interacción con nuestros formularios es sometida a rigurosos procesos de sanitización backend, diseñados específicamente para prevenir inyecciones de código (SQL Injection) y garantizar la estabilidad de la base de datos.</p>
                                </div>
                            </div>

                            {/* Sección 4: Moderación y Roles (CORREGIDA) */}
                            <div className="gv-privacy-item">
                                <div className="gv-privacy-icon"><i className="bi bi-hammer"></i></div>
                                <div className="gv-privacy-text">
                                    <h4>4. Entorno seguro y políticas de moderación</h4>
                                    <p>Para preservar un ecosistema constructivo y libre de comportamientos perjudiciales, nuestro equipo de administración ejerce una supervisión activa sobre el cumplimiento de nuestras directrices. GameVault utiliza un sistema de jerarquía de acceso que permite a los administradores gestionar el catálogo y moderar la base de usuarios. Nos reservamos el derecho de aplicar medidas disciplinarias, incluyendo la suspensión permanente (baneo) de aquellas cuentas que vulneren nuestras normas. A nivel técnico, el sistema verifica el estado de la cuenta en cada intento de inicio de sesión; si un usuario figura como suspendido en nuestros registros, el acceso será denegado de forma inmediata en la fase de identificación primaria, impidiendo cualquier interacción con la plataforma.</p>
                                </div>
                            </div>

                            {/* Sección 5: Derechos del Usuario */}
                            <div className="gv-privacy-item">
                                <div className="gv-privacy-icon"><i className="bi bi-person-gear"></i></div>
                                <div className="gv-privacy-text">
                                    <h4>5. Soberanía de los datos y Derechos ARCO</h4>
                                    <p>Reconocemos y garantizamos tu soberanía sobre los datos que introduces en nuestra plataforma, en pleno cumplimiento de las normativas de protección de datos vigentes. Como usuario registrado, dispones de total autonomía para ejercer tus derechos de acceso, rectificación y supresión de manera directa. A través de las herramientas proporcionadas en tu panel de configuración y en la interfaz de gestión de la biblioteca, puedes alterar en cualquier momento tus datos de identidad visual, así como modificar o eliminar los registros de progreso de tus videojuegos. Asimismo, posees la potestad de sobrescribir o eliminar permanentemente de nuestros servidores centrales cualquier reseña o valoración pública que hayas emitido en el pasado, procesándose dicha eliminación de forma inmediata.</p>
                                </div>
                            </div>

                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Privacy;