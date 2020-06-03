import React, {useState, useEffect} from 'react';
import {Link, useHistory} from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import {LeafletMouseEvent} from 'leaflet';
import {Map, TileLayer, Marker} from 'react-leaflet';

import api from '../../services/api';

import './styles.css';
import logo from '../../assets/logo.svg'

interface Item {
    id: number;
    image_url: string;
    title: string;
}

interface IBGEUFResponse {
    id: number;
    sigla: string;
    nome: string;
}

interface IBGECityResponse {
    id: number;
    nome: string;
}

const CreatePoint: React.FC = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [selectedUF, setSelectedUF] = useState<string>('0');
    const [ufs, setUFs] = useState<IBGEUFResponse[]>([]);
    const [cities, setCities] = useState<IBGECityResponse[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [initialPosition, setInitialPosition] = useState<[number,number]>([0,0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();

    useEffect( () => {

        api.get('/items').then((response) => {
            setItems(response.data);
        })

    }, []);

    useEffect(() => {

        api.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            setUFs(response.data);
        });

    });

    useEffect(() => {
        if(selectedUF === "0") {
            return;
        }

        api.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`).then(response => {
            setCities(response.data);
        })
       
    }, [selectedUF]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            setInitialPosition([position.coords.latitude, position.coords.longitude]);
        })
    });

    async function handleSelectUF(e: React.ChangeEvent<HTMLSelectElement>) {
        const selectedUF = e.target.value;
        setSelectedUF(selectedUF);
    }

    function handleSelectCity(e: React.ChangeEvent<HTMLSelectElement>) {
        const selectedCity = e.target.value;
        setSelectedCity(selectedCity);
    }

    function handleMapClick(e: LeafletMouseEvent) {
        setSelectedPosition([e.latlng.lat, e.latlng.lng]);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    }

    function handleItemClick(id: number) {
        if(selectedItems.includes(id))
            setSelectedItems(selectedItems.filter(itemID => itemID !== id));
        else
            selectedItems.push(id);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        const {name, email, whatsapp} = formData;
        const uf = selectedUF;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items,
        };

        await api.post('points', data);

        alert('Ponto de coleta cadastrado');

        history.push('/');
        
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>
                    Cadastro do ponto de coleta
                </h1>

                <fieldset>
                    <legend><h2>Dados</h2></legend>

                    <div className="field">
                        <label htmlFor="name">Nome de Entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}

                            />
                        </div>

                        <div className="field">
                            <label htmlFor="name">WhatsApp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>

                    </div>
                    
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}></Marker>
                    </Map>

                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUF} onChange={handleSelectUF}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf.id} value={uf.sigla}>{uf.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                            </select>
                        </div>

                    </div>

                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map((item) => {
                            return (
                                <li
                                    key={item.id}
                                    onClick={() => {
                                        handleItemClick(item.id)
                                    }}
                                    className={selectedItems.includes(item.id) ? "selected": ""}
                                >
                                    <img src={item.image_url} alt={item.title}/>
                                    <span>{item.title}</span>
                                </li>
                            )
                        })}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
};

export default CreatePoint;
